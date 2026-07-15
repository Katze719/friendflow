import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AppVersionInfo } from "../api/types";
import { buildApiUrl, useActiveInstance } from "./instances";
import {
  subscribeAppUpdateRequired,
  type AppUpdateRequiredPayload,
} from "./appCompatibilityEvents";

const CHECK_INTERVAL_MS = 10 * 60 * 1000;

type CompatibilityStatus =
  | "checking"
  | "compatible"
  | "update_available"
  | "update_required"
  | "unknown";

interface AppCompatibilityState {
  status: CompatibilityStatus;
  info: AppVersionInfo | null;
  clientVersion: string;
  updateUrl: string | null;
  refresh: () => Promise<void>;
}

const AppCompatibilityContext = createContext<AppCompatibilityState | null>(null);

export function AppCompatibilityProvider({ children }: { children: ReactNode }) {
  const instance = useActiveInstance();
  const [state, setState] = useState<Omit<AppCompatibilityState, "refresh" | "updateUrl">>({
    status: "checking",
    info: null,
    clientVersion: __APP_VERSION__,
  });

  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const info = await fetchAppVersionForBaseUrl(instance.baseUrl, signal);
        setState({
          status: evaluateCompatibility(__APP_VERSION__, info),
          info,
          clientVersion: __APP_VERSION__,
        });
      } catch {
        setState((current) => {
          if (current.status === "update_required") return current;
          return {
            status: "unknown",
            info: null,
            clientVersion: __APP_VERSION__,
          };
        });
      }
    },
    [instance.baseUrl],
  );

  useEffect(() => {
    const controller = new AbortController();
    setState({
      status: "checking",
      info: null,
      clientVersion: __APP_VERSION__,
    });
    void refresh(controller.signal);

    const refreshIfVisible = () => {
      if (typeof document === "undefined" || document.visibilityState === "visible") {
        void refresh();
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const interval = window.setInterval(refreshIfVisible, CHECK_INTERVAL_MS);

    window.addEventListener("focus", refreshIfVisible);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      controller.abort();
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshIfVisible);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [instance.baseUrl, instance.kind, refresh]);

  useEffect(() => {
    return subscribeAppUpdateRequired((payload) => {
      setState((current) => ({
        status: "update_required",
        clientVersion: __APP_VERSION__,
        info: mergeUpdateRequiredPayload(current.info, payload),
      }));
    });
  }, []);

  const value = useMemo<AppCompatibilityState>(
    () => ({
      ...state,
      updateUrl: getStoreUrl(state.info),
      refresh: () => refresh(),
    }),
    [refresh, state],
  );

  return (
    <AppCompatibilityContext.Provider value={value}>
      {children}
    </AppCompatibilityContext.Provider>
  );
}

export function useAppCompatibility(): AppCompatibilityState {
  const ctx = useContext(AppCompatibilityContext);
  if (!ctx) {
    throw new Error("useAppCompatibility must be used inside AppCompatibilityProvider");
  }
  return ctx;
}

async function fetchAppVersionForBaseUrl(
  baseUrl: string,
  signal?: AbortSignal,
): Promise<AppVersionInfo> {
  const res = await fetch(buildApiUrl(baseUrl, "/api/app/version"), {
    method: "GET",
    headers: {
      "X-Friendflow-App-Version": __APP_VERSION__,
    },
    signal,
  });
  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok || !data || typeof data !== "object") {
    throw new Error(`HTTP ${res.status}`);
  }

  const info = data as Partial<AppVersionInfo>;
  if (typeof info.backend_version !== "string") {
    throw new Error("invalid_app_version");
  }

  return {
    backend_version: info.backend_version,
    minimum_supported_app_version: optionalString(info.minimum_supported_app_version),
    latest_app_version: optionalString(info.latest_app_version),
    ios_store_url: optionalString(info.ios_store_url),
    android_store_url: optionalString(info.android_store_url),
    message: optionalString(info.message),
  };
}

function evaluateCompatibility(clientVersion: string, info: AppVersionInfo): CompatibilityStatus {
  if (
    info.minimum_supported_app_version &&
    compareVersions(clientVersion, info.minimum_supported_app_version) < 0
  ) {
    return "update_required";
  }

  if (info.latest_app_version && compareVersions(clientVersion, info.latest_app_version) < 0) {
    return "update_available";
  }

  return "compatible";
}

function compareVersions(a: string, b: string): number {
  const parsedA = parseVersion(a);
  const parsedB = parseVersion(b);
  if (!parsedA || !parsedB) return 0;

  for (let i = 0; i < 3; i += 1) {
    if (parsedA[i] !== parsedB[i]) return parsedA[i] - parsedB[i];
  }
  return 0;
}

function parseVersion(raw: string): [number, number, number] | null {
  const match = raw.trim().match(/^v?(\d+)\.(\d+)(?:\.(\d+))?/i);
  if (!match) return null;
  return [
    Number.parseInt(match[1], 10),
    Number.parseInt(match[2], 10),
    Number.parseInt(match[3] ?? "0", 10),
  ];
}

function mergeUpdateRequiredPayload(
  current: AppVersionInfo | null,
  payload: AppUpdateRequiredPayload,
): AppVersionInfo {
  return {
    backend_version: current?.backend_version ?? "unknown",
    minimum_supported_app_version:
      payload.minimum_supported_app_version ?? current?.minimum_supported_app_version,
    latest_app_version: payload.latest_app_version ?? current?.latest_app_version,
    ios_store_url: current?.ios_store_url,
    android_store_url: current?.android_store_url,
    message: payload.message ?? current?.message,
  };
}

function getStoreUrl(info: AppVersionInfo | null): string | null {
  if (!info) return null;
  const platform = getClientPlatform();
  if (platform === "ios") return info.ios_store_url ?? null;
  if (platform === "android") return info.android_store_url ?? null;
  return null;
}

function getClientPlatform(): "ios" | "android" | "web" {
  const maybeCapacitor = (globalThis as typeof globalThis & {
    Capacitor?: { getPlatform?: () => string };
  }).Capacitor;
  const platform = maybeCapacitor?.getPlatform?.();
  if (platform === "ios" || platform === "android") return platform;
  return "web";
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
