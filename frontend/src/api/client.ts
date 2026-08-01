import { buildApiUrl, getActiveInstance, readInstanceStorage, writeInstanceStorage } from "../lib/instances";
import { emitAppUpdateRequired } from "../lib/appCompatibilityEvents";
import i18n from "../i18n";
import { getConnectionState, setConnectionState } from "../offline/networkState";
import { emitOnlineRequired } from "../offline/onlineRequiredEvents";
import {
  cacheCreatedResponse,
  getCachedResponse,
  putCachedResponse,
  queueOfflineCreate,
} from "../offline/storage";

export function getToken(): string | null {
  return readInstanceStorage("token");
}

export function setToken(token: string | null): void {
  writeInstanceStorage("token", token);
}

export class ApiError extends Error {
  status: number;
  code: string | null;
  constructor(status: number, message: string, code: string | null = null) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
  signal?: AbortSignal;
  /** Allows only a brand-new, conflict-free entity to be queued offline. */
  offlineCreate?: {
    optimistic: object;
    cachePath: string;
    cacheField?: string;
  };
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true, signal, offlineCreate } = options;

  const operationId = offlineCreate ? crypto.randomUUID() : null;
  if (method !== "GET" && getConnectionState() === "offline") {
    if (offlineCreate && operationId) {
      return queueCreate<T>(path, body, offlineCreate, operationId);
    }
    emitOnlineRequired();
    throw new ApiError(0, i18n.t("offline.internetRequired"), "internet_required");
  }

  const headers: Record<string, string> = {};
  headers["X-Friendflow-App-Version"] = __APP_VERSION__;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (operationId) headers["X-Friendflow-Operation-Id"] = operationId;
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const url = buildApiUrl(getActiveInstance().baseUrl, path);
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
    setConnectionState("online");
  } catch (error) {
    if (signal?.aborted) throw error;
    setConnectionState("offline");
    if (method === "GET") {
      const cached = await getCachedResponse<T>(path);
      if (cached !== null) return cached;
    }
    if (offlineCreate && operationId) {
      return queueCreate<T>(path, body, offlineCreate, operationId);
    }
    if (method !== "GET") emitOnlineRequired();
    throw new ApiError(0, i18n.t("offline.internetRequired"), "internet_required");
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    const obj = data && typeof data === "object" ? (data as Record<string, unknown>) : null;
    const message =
      (obj && typeof obj.error === "string" ? (obj.error as string) : null) ?? `HTTP ${res.status}`;
    const code = obj && typeof obj.code === "string" ? (obj.code as string) : null;
    if (res.status === 426 && code === "app_update_required") {
      emitAppUpdateRequired({
        minimum_supported_app_version:
          obj && typeof obj.minimum_supported_app_version === "string"
            ? obj.minimum_supported_app_version
            : undefined,
        latest_app_version:
          obj && typeof obj.latest_app_version === "string"
            ? obj.latest_app_version
            : undefined,
        message: obj && typeof obj.message === "string" ? obj.message : undefined,
      });
    }
    if (res.status === 401) setToken(null);
    throw new ApiError(res.status, message, code);
  }

  if (method === "GET") {
    await putCachedResponse(path, data);
  } else if (offlineCreate) {
    await cacheCreatedResponse(offlineCreate.cachePath, offlineCreate.cacheField, data);
  }
  return data as T;
}

async function queueCreate<T>(
  path: string,
  body: unknown,
  offlineCreate: NonNullable<RequestOptions["offlineCreate"]>,
  operationId: string,
): Promise<T> {
  const optimisticInput = offlineCreate.optimistic as Record<string, unknown>;
  const entityId = typeof optimisticInput.id === "string"
    ? optimisticInput.id
    : crypto.randomUUID();
  const optimistic = {
    ...optimisticInput,
    id: entityId,
    local_sync_state: "pending",
  };
  await queueOfflineCreate({
    operationId,
    entityId,
    path,
    body: body && typeof body === "object" && !Array.isArray(body)
      ? { ...(body as Record<string, unknown>), _offline_id: entityId }
      : body,
    optimistic,
    cachePath: offlineCreate.cachePath,
    cacheField: offlineCreate.cacheField,
  });
  return optimistic as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
