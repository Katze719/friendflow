import { buildApiUrl, getActiveInstance, readInstanceStorage, writeInstanceStorage } from "../lib/instances";
import { emitAppUpdateRequired } from "../lib/appCompatibilityEvents";

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
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true, signal } = options;

  const headers: Record<string, string> = {};
  headers["X-Friendflow-App-Version"] = __APP_VERSION__;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const url = buildApiUrl(getActiveInstance().baseUrl, path);
  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

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

  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
