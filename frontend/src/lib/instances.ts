import { useSyncExternalStore } from "react";
import type { AuthConfig } from "../api/types";

export interface AppInstance {
  kind: "default" | "custom";
  label: string;
  baseUrl: string;
}

const ACTIVE_INSTANCE_KEY = "friendflow.instance.active";
const LEGACY_STORAGE_KEYS = {
  token: "friendflow.token",
  user: "friendflow.user",
  groups: "friendflow.groups",
} as const;

type LegacyScopedKey = keyof typeof LEGACY_STORAGE_KEYS;

const DEFAULT_INSTANCE_BASE_URL = resolveDefaultInstanceBaseUrl();
const DEFAULT_INSTANCE_LABEL = resolveDefaultInstanceLabel(DEFAULT_INSTANCE_BASE_URL);
const DEFAULT_INSTANCE: AppInstance = {
  kind: "default",
  label: DEFAULT_INSTANCE_LABEL,
  baseUrl: DEFAULT_INSTANCE_BASE_URL,
};

let activeInstance = readPersistedInstance();
const listeners = new Set<() => void>();

export function getDefaultInstance(): AppInstance {
  return DEFAULT_INSTANCE;
}

export function getActiveInstance(): AppInstance {
  return activeInstance;
}

export function useActiveInstance(): AppInstance {
  return useSyncExternalStore(subscribeToActiveInstance, getActiveInstance, getActiveInstance);
}

export function subscribeToActiveInstance(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isDefaultInstance(instance: AppInstance = getActiveInstance()): boolean {
  return instance.kind === "default";
}

export function hasConfiguredDefaultInstance(): boolean {
  return DEFAULT_INSTANCE.baseUrl !== "" || !isNativeRuntime();
}

export function getInstanceStorageKey(slot: string, instance: AppInstance = getActiveInstance()): string {
  return `friendflow.${slot}.${storageNamespace(instance)}`;
}

export function readInstanceStorage(
  slot: LegacyScopedKey,
  instance: AppInstance = getActiveInstance(),
): string | null {
  try {
    const scopedKey = getInstanceStorageKey(slot, instance);
    const scoped = localStorage.getItem(scopedKey);
    if (scoped !== null) return scoped;

    if (!isDefaultInstance(instance)) return null;
    const legacyKey = LEGACY_STORAGE_KEYS[slot];
    const legacy = localStorage.getItem(legacyKey);
    if (legacy === null) return null;
    localStorage.setItem(scopedKey, legacy);
    localStorage.removeItem(legacyKey);
    return legacy;
  } catch {
    return null;
  }
}

export function writeInstanceStorage(
  slot: LegacyScopedKey,
  value: string | null,
  instance: AppInstance = getActiveInstance(),
): void {
  try {
    const scopedKey = getInstanceStorageKey(slot, instance);
    if (value === null) localStorage.removeItem(scopedKey);
    else localStorage.setItem(scopedKey, value);

    if (isDefaultInstance(instance)) {
      const legacyKey = LEGACY_STORAGE_KEYS[slot];
      if (value === null) localStorage.removeItem(legacyKey);
      else localStorage.removeItem(legacyKey);
    }
  } catch {
    /* ignore */
  }
}

export function clearInstanceStorage(
  slot: LegacyScopedKey,
  instance: AppInstance = getActiveInstance(),
): void {
  writeInstanceStorage(slot, null, instance);
}

export function setActiveInstance(next: AppInstance): void {
  const sanitized = sanitizeInstance(next);
  activeInstance = sanitized;
  try {
    if (instancesMatch(DEFAULT_INSTANCE, sanitized)) {
      localStorage.removeItem(ACTIVE_INSTANCE_KEY);
    } else {
      localStorage.setItem(ACTIVE_INSTANCE_KEY, JSON.stringify(sanitized));
    }
  } catch {
    /* ignore */
  }
  emitChange();
}

export function resetToDefaultInstance(): void {
  setActiveInstance(DEFAULT_INSTANCE);
}

export function normalizeCustomInstanceUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (url.username || url.password) return null;
    if (url.search || url.hash) return null;
    if (url.pathname !== "/" && url.pathname !== "") return null;

    const protocol = url.protocol.toLowerCase();
    if (protocol !== "https:" && !(protocol === "http:" && isLocalHost(url.hostname))) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

export function getInstanceDisplayHost(baseUrl: string): string {
  if (!baseUrl) return DEFAULT_INSTANCE.label;
  try {
    return new URL(baseUrl).host;
  } catch {
    return baseUrl;
  }
}

export function buildApiUrl(baseUrl: string, path: string): string {
  return `${baseUrl}${path}`;
}

export async function fetchAuthConfigForBaseUrl(
  baseUrl: string,
  signal?: AbortSignal,
): Promise<AuthConfig> {
  const res = await fetch(buildApiUrl(baseUrl, "/api/auth/config"), {
    method: "GET",
    signal,
  });

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok || !data || typeof data !== "object") {
    throw new Error(`HTTP ${res.status}`);
  }

  const cfg = data as Partial<AuthConfig>;
  if (
    (cfg.registration_mode !== "approval" && cfg.registration_mode !== "open") ||
    (cfg.password_reset_enabled !== undefined && typeof cfg.password_reset_enabled !== "boolean") ||
    (cfg.instance_name !== undefined && typeof cfg.instance_name !== "string")
  ) {
    throw new Error("invalid_auth_config");
  }

  return cfg as AuthConfig;
}

function resolveDefaultInstanceBaseUrl(): string {
  const configured = normalizeConfiguredBaseUrl(import.meta.env.VITE_DEFAULT_INSTANCE_URL ?? "");
  if (configured) return configured;

  const apiBase = normalizeConfiguredBaseUrl(import.meta.env.VITE_API_URL ?? "");
  if (apiBase) return apiBase;

  return "";
}

function resolveDefaultInstanceLabel(baseUrl: string): string {
  const configured = (import.meta.env.VITE_DEFAULT_INSTANCE_LABEL ?? "").trim();
  if (configured) return configured;

  if (!isNativeRuntime() && typeof window !== "undefined") {
    const host = window.location.host.trim();
    if (host && !isLocalHost(window.location.hostname)) return host;
  }

  if (baseUrl) return getInstanceDisplayHost(baseUrl);
  return "friendflow";
}

function sanitizeInstance(instance: AppInstance): AppInstance {
  const wantsCustom = instance.kind === "custom";
  const normalizedCustomBaseUrl = wantsCustom ? normalizeCustomInstanceUrl(instance.baseUrl) : null;
  const kind = wantsCustom && normalizedCustomBaseUrl ? "custom" : "default";
  const baseUrl = kind === "custom" ? normalizedCustomBaseUrl! : DEFAULT_INSTANCE.baseUrl;
  const label = instance.label.trim() || (
    kind === "custom" ? getInstanceDisplayHost(baseUrl) : DEFAULT_INSTANCE.label
  );

  return { kind, label, baseUrl };
}

function readPersistedInstance(): AppInstance {
  if (typeof window === "undefined") return DEFAULT_INSTANCE;

  try {
    const raw = localStorage.getItem(ACTIVE_INSTANCE_KEY);
    if (!raw) return DEFAULT_INSTANCE;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return DEFAULT_INSTANCE;

    const baseUrl =
      typeof (parsed as AppInstance).baseUrl === "string" ? (parsed as AppInstance).baseUrl : "";
    const label =
      typeof (parsed as AppInstance).label === "string" ? (parsed as AppInstance).label : "";
    const kind = (parsed as AppInstance).kind === "custom" ? "custom" : "default";

    return sanitizeInstance({ kind, label, baseUrl });
  } catch {
    return DEFAULT_INSTANCE;
  }
}

function storageNamespace(instance: AppInstance): string {
  return encodeURIComponent(instance.kind === "default" ? `default:${instance.baseUrl}` : instance.baseUrl);
}

function instancesMatch(a: AppInstance, b: AppInstance): boolean {
  return a.kind === b.kind && a.label === b.label && a.baseUrl === b.baseUrl;
}

function emitChange(): void {
  for (const listener of listeners) listener();
}

function normalizeConfiguredBaseUrl(raw: string): string {
  return raw.trim().replace(/\/$/, "");
}

function isLocalHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return lower === "localhost" || lower === "127.0.0.1" || lower === "::1" || lower.endsWith(".local");
}

function isNativeRuntime(): boolean {
  const maybeCapacitor = (globalThis as typeof globalThis & {
    Capacitor?: { isNativePlatform?: () => boolean };
  }).Capacitor;
  return maybeCapacitor?.isNativePlatform?.() === true;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
