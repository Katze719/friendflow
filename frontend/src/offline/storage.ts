import { Capacitor } from "@capacitor/core";
import { SecureStorage } from "@aparajita/capacitor-secure-storage";
import Dexie, { type EntityTable } from "dexie";
import { getActiveInstance, readInstanceStorage } from "../lib/instances";

export type LocalSyncState = "pending" | "syncing" | "draft";

export interface OfflineEntityMeta {
  local_sync_state?: LocalSyncState;
  local_sync_error?: string;
}

interface EncryptedValue {
  iv: string;
  ciphertext: string;
}

interface CacheRow extends EncryptedValue {
  key: string;
  owner: string;
  path: string;
  updatedAt: number;
}

interface OperationRow extends EncryptedValue {
  id: string;
  owner: string;
  entityId: string;
  cachePath: string;
  cacheField: string;
  state: LocalSyncState;
  createdAt: number;
}

interface KeyRow {
  id: string;
  key: CryptoKey;
}

export interface QueuedCreatePayload {
  path: string;
  body: unknown;
  optimistic: Record<string, unknown>;
}

export interface QueuedCreate {
  id: string;
  entityId: string;
  cachePath: string;
  cacheField: string;
  state: LocalSyncState;
  createdAt: number;
  payload: QueuedCreatePayload;
}

interface QueueCreateInput {
  operationId: string;
  entityId: string;
  path: string;
  body: unknown;
  optimistic: Record<string, unknown>;
  cachePath: string;
  cacheField?: string;
}

class OfflineDatabase extends Dexie {
  cache!: EntityTable<CacheRow, "key">;
  operations!: EntityTable<OperationRow, "id">;
  keys!: EntityTable<KeyRow, "id">;

  constructor() {
    super("friendflow-offline-v1");
    this.version(1).stores({
      cache: "key, owner, path, updatedAt",
      operations: "id, owner, entityId, state, createdAt",
      keys: "id",
    });
  }
}

const db = new OfflineDatabase();
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const keyPromises = new Map<string, Promise<CryptoKey>>();
const listeners = new Set<() => void>();

export function subscribeOfflineStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitChange(): void {
  for (const listener of listeners) listener();
}

export function currentOfflineOwner(): string | null {
  const raw = readInstanceStorage("user");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { id?: unknown };
    if (typeof parsed.id !== "string") return null;
    const instance = getActiveInstance();
    return `${instance.kind}:${instance.baseUrl}:${parsed.id}`;
  } catch {
    return null;
  }
}

export function currentOfflineUser(): { id: string; display_name: string } | null {
  const raw = readInstanceStorage("user");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { id?: unknown; display_name?: unknown };
    return typeof parsed.id === "string" && typeof parsed.display_name === "string"
      ? { id: parsed.id, display_name: parsed.display_name }
      : null;
  } catch {
    return null;
  }
}

export async function putCachedResponse(path: string, value: unknown): Promise<void> {
  const owner = currentOfflineOwner();
  if (!owner) return;
  const updatedAt = Date.now();
  const merged = await mergeQueuedEntities(owner, path, value);
  const encrypted = await encrypt(owner, `cache:${path}:${updatedAt}`, merged);
  await db.cache.put({
    key: cacheKey(owner, path),
    owner,
    path,
    updatedAt,
    ...encrypted,
  });
}

export async function getCachedResponse<T>(path: string): Promise<T | null> {
  const owner = currentOfflineOwner();
  if (!owner) return null;
  const row = await db.cache.get(cacheKey(owner, path));
  if (!row) return null;
  try {
    return await decrypt<T>(owner, `cache:${path}:${row.updatedAt}`, row);
  } catch {
    await db.cache.delete(row.key);
    return null;
  }
}

export async function cacheCreatedResponse(
  path: string,
  field: string | undefined,
  value: unknown,
): Promise<void> {
  const entity = value && typeof value === "object"
    ? value as Record<string, unknown>
    : null;
  if (!entity) return;
  await mutateCachedCollection(path, field ?? "", (items) => [
    entity,
    ...items.filter((item) => item.id !== entity.id),
  ]);
}

export async function queueOfflineCreate(input: QueueCreateInput): Promise<void> {
  const owner = currentOfflineOwner();
  if (!owner) throw new Error("offline_user_unavailable");
  const cacheField = input.cacheField ?? "";
  const payload: QueuedCreatePayload = {
    path: input.path,
    body: input.body,
    optimistic: { ...(input.optimistic as Record<string, unknown>), local_sync_state: "pending" },
  };
  const encrypted = await encrypt(owner, operationAad(input.operationId), payload);
  await db.operations.put({
    id: input.operationId,
    owner,
    entityId: input.entityId,
    cachePath: input.cachePath,
    cacheField,
    state: "pending",
    createdAt: Date.now(),
    ...encrypted,
  });
  await mutateCachedCollection(input.cachePath, cacheField, (items) => [
    payload.optimistic,
    ...items.filter((item) => item.id !== input.entityId),
  ]);
  emitChange();
}

export async function listQueuedCreates(): Promise<QueuedCreate[]> {
  const owner = currentOfflineOwner();
  if (!owner) return [];
  const rows = await db.operations.where("owner").equals(owner).sortBy("createdAt");
  const result: QueuedCreate[] = [];
  for (const row of rows) {
    try {
      result.push({
        id: row.id,
        entityId: row.entityId,
        cachePath: row.cachePath,
        cacheField: row.cacheField,
        state: row.state,
        createdAt: row.createdAt,
        payload: await decrypt<QueuedCreatePayload>(owner, operationAad(row.id), row),
      });
    } catch {
      await db.operations.delete(row.id);
    }
  }
  return result;
}

export async function countPendingCreates(): Promise<number> {
  const owner = currentOfflineOwner();
  if (!owner) return 0;
  return db.operations
    .where("owner")
    .equals(owner)
    .filter((row) => row.state === "pending")
    .count();
}

export async function setOperationSyncing(id: string, syncing: boolean): Promise<void> {
  const row = await db.operations.get(id);
  if (!row || row.state === "draft") return;
  row.state = syncing ? "syncing" : "pending";
  await db.operations.put(row);
  await setCachedEntityState(row, row.state);
  emitChange();
}

export async function completeOperation(id: string, serverValue: unknown): Promise<void> {
  const row = await db.operations.get(id);
  if (!row) return;
  const serverId = serverValue && typeof serverValue === "object"
    ? (serverValue as { id?: unknown }).id
    : null;
  if (typeof serverId === "string" && serverId !== row.entityId) {
    await remapQueuedReferences(row.owner, row.entityId, serverId);
  }
  await db.operations.delete(id);
  await mutateCachedCollection(row.cachePath, row.cacheField, (items) =>
    items.map((item) => item.id === row.entityId ? stripLocalMeta(serverValue) : item),
  );
  emitChange();
}

async function remapQueuedReferences(owner: string, fromId: string, toId: string): Promise<void> {
  const rows = await db.operations.where("owner").equals(owner).toArray();
  for (const row of rows) {
    const payload = await decrypt<QueuedCreatePayload>(owner, operationAad(row.id), row);
    const nextPayload = replaceReferences(payload, fromId, toId) as QueuedCreatePayload;
    row.cachePath = row.cachePath.split(fromId).join(toId);
    Object.assign(row, await encrypt(owner, operationAad(row.id), nextPayload));
    await db.operations.put(row);
  }
}

function replaceReferences(value: unknown, fromId: string, toId: string): unknown {
  if (value === fromId) return toId;
  if (Array.isArray(value)) return value.map((item) => replaceReferences(item, fromId, toId));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [
      key,
      replaceReferences(item, fromId, toId),
    ]));
  }
  return value;
}

export async function keepOperationAsDraft(id: string, reason: string): Promise<void> {
  const row = await db.operations.get(id);
  if (!row) return;
  row.state = "draft";
  const payload = await decrypt<QueuedCreatePayload>(row.owner, operationAad(row.id), row);
  payload.optimistic.local_sync_state = "draft";
  payload.optimistic.local_sync_error = reason;
  Object.assign(row, await encrypt(row.owner, operationAad(row.id), payload));
  await db.operations.put(row);
  await setCachedEntityState(row, "draft", reason);
  emitChange();
}

async function mergeQueuedEntities(owner: string, path: string, value: unknown): Promise<unknown> {
  const rows = await db.operations.where("owner").equals(owner).toArray();
  const relevant = rows.filter((row) => row.cachePath === path);
  if (relevant.length === 0) return value;
  let result = value;
  for (const row of relevant) {
    const payload = await decrypt<QueuedCreatePayload>(owner, operationAad(row.id), row);
    const optimistic = {
      ...payload.optimistic,
      local_sync_state: row.state,
    };
    if (row.cacheField) {
      const object = result && typeof result === "object" && !Array.isArray(result)
        ? { ...(result as Record<string, unknown>) }
        : {};
      const items = Array.isArray(object[row.cacheField])
        ? object[row.cacheField] as Record<string, unknown>[]
        : [];
      object[row.cacheField] = [
        optimistic,
        ...items.filter((item) => item.id !== row.entityId),
      ];
      result = object;
    } else {
      const items = Array.isArray(result) ? result as Record<string, unknown>[] : [];
      result = [optimistic, ...items.filter((item) => item.id !== row.entityId)];
    }
  }
  return result;
}

export async function updatePendingCreate<T extends object>(
  entityId: string,
  bodyPatch: object,
  optimisticPatch: object = bodyPatch,
): Promise<T | null> {
  const owner = currentOfflineOwner();
  if (!owner) return null;
  const row = await db.operations.where("entityId").equals(entityId).first();
  if (!row || row.owner !== owner) return null;
  const payload = await decrypt<QueuedCreatePayload>(owner, operationAad(row.id), row);
  payload.body = { ...(payload.body as Record<string, unknown>), ...(bodyPatch as Record<string, unknown>) };
  payload.optimistic = {
    ...payload.optimistic,
    ...(optimisticPatch as Record<string, unknown>),
    local_sync_state: row.state,
  };
  Object.assign(row, await encrypt(owner, operationAad(row.id), payload));
  await db.operations.put(row);
  await mutateCachedCollection(row.cachePath, row.cacheField, (items) =>
    items.map((item) => item.id === entityId ? payload.optimistic : item),
  );
  emitChange();
  return payload.optimistic as T;
}

export async function removePendingCreate(entityId: string): Promise<boolean> {
  const owner = currentOfflineOwner();
  if (!owner) return false;
  const row = await db.operations.where("entityId").equals(entityId).first();
  if (!row || row.owner !== owner) return false;
  await mutateCachedCollection(row.cachePath, row.cacheField, (items) =>
    items.filter((item) => item.id !== entityId),
  );
  await db.operations.delete(row.id);
  emitChange();
  return true;
}

export async function isPendingLocalEntity(entityId: string): Promise<boolean> {
  const owner = currentOfflineOwner();
  if (!owner) return false;
  const row = await db.operations.where("entityId").equals(entityId).first();
  return row?.owner === owner;
}

export async function getEntitySyncMeta(entityId: string): Promise<OfflineEntityMeta> {
  const owner = currentOfflineOwner();
  if (!owner) return {};
  const row = await db.operations.where("entityId").equals(entityId).first();
  if (!row || row.owner !== owner) return {};
  let error: string | undefined;
  if (row.state === "draft") {
    try {
      const payload = await decrypt<QueuedCreatePayload>(owner, operationAad(row.id), row);
      error = typeof payload.optimistic.local_sync_error === "string"
        ? payload.optimistic.local_sync_error
        : undefined;
    } catch {
      error = undefined;
    }
  }
  return { local_sync_state: row.state, local_sync_error: error };
}

export async function clearCurrentOfflineData(): Promise<void> {
  const owner = currentOfflineOwner();
  if (!owner) return;
  await Promise.all([
    db.cache.where("owner").equals(owner).delete(),
    db.operations.where("owner").equals(owner).delete(),
    deleteKey(owner),
  ]);
  keyPromises.delete(owner);
  emitChange();
}

async function mutateCachedCollection(
  path: string,
  field: string,
  mutate: (items: Record<string, unknown>[]) => Record<string, unknown>[],
): Promise<void> {
  const cached = await getCachedResponse<unknown>(path);
  if (field) {
    const object = cached && typeof cached === "object" && !Array.isArray(cached)
      ? { ...(cached as Record<string, unknown>) }
      : {};
    const current = Array.isArray(object[field])
      ? object[field] as Record<string, unknown>[]
      : [];
    object[field] = mutate(current);
    await putCachedResponse(path, object);
    return;
  }
  const current = Array.isArray(cached) ? cached as Record<string, unknown>[] : [];
  await putCachedResponse(path, mutate(current));
}

async function setCachedEntityState(
  row: OperationRow,
  state: LocalSyncState,
  error?: string,
): Promise<void> {
  await mutateCachedCollection(row.cachePath, row.cacheField, (items) =>
    items.map((item) => item.id === row.entityId
      ? { ...item, local_sync_state: state, local_sync_error: error }
      : item),
  );
}

function stripLocalMeta(value: unknown): Record<string, unknown> {
  const result = value && typeof value === "object"
    ? { ...(value as Record<string, unknown>) }
    : {};
  delete result.local_sync_state;
  delete result.local_sync_error;
  return result;
}

async function encrypt(owner: string, aad: string, value: unknown): Promise<EncryptedValue> {
  const key = await getEncryptionKey(owner);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = encoder.encode(JSON.stringify(value));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: encoder.encode(`${owner}:${aad}`) },
    key,
    plaintext,
  );
  return { iv: toBase64(iv), ciphertext: toBase64(new Uint8Array(ciphertext)) };
}

async function decrypt<T>(owner: string, aad: string, value: EncryptedValue): Promise<T> {
  const key = await getEncryptionKey(owner);
  const plaintext = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: fromBase64(value.iv),
      additionalData: encoder.encode(`${owner}:${aad}`),
    },
    key,
    fromBase64(value.ciphertext),
  );
  return JSON.parse(decoder.decode(plaintext)) as T;
}

function getEncryptionKey(owner: string): Promise<CryptoKey> {
  const existing = keyPromises.get(owner);
  if (existing) return existing;
  const promise = loadOrCreateKey(owner);
  keyPromises.set(owner, promise);
  return promise;
}

async function loadOrCreateKey(owner: string): Promise<CryptoKey> {
  if (Capacitor.isNativePlatform()) {
    await SecureStorage.setKeyPrefix("friendflow_offline_");
    const storageKey = keyStorageId(owner);
    const stored = await SecureStorage.get(storageKey, false, false);
    if (typeof stored === "string") {
      return importRawKey(fromBase64(stored));
    }
    const raw = crypto.getRandomValues(new Uint8Array(32));
    await SecureStorage.set(storageKey, toBase64(raw), false, false);
    return importRawKey(raw);
  }

  const id = keyStorageId(owner);
  const stored = await db.keys.get(id);
  if (stored) return stored.key;
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
  await db.keys.put({ id, key });
  return key;
}

async function importRawKey(raw: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function deleteKey(owner: string): Promise<void> {
  const id = keyStorageId(owner);
  if (Capacitor.isNativePlatform()) {
    await SecureStorage.setKeyPrefix("friendflow_offline_");
    await SecureStorage.remove(id, false);
  } else {
    await db.keys.delete(id);
  }
}

function cacheKey(owner: string, path: string): string {
  return `${owner}|${path}`;
}

function operationAad(id: string): string {
  return `operation:${id}`;
}

function keyStorageId(owner: string): string {
  const bytes = encoder.encode(owner);
  return `key_${toBase64(bytes).split("/").join("_").split("+").join("-").split("=").join("")}`;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}
