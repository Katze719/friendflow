/* eslint-disable react-refresh/only-export-components */
import { RefreshCw, Upload, Wifi, WifiOff } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import { api, getToken } from "../api/client";
import type { GroupSummary, ShoppingList, TournamentSummary, Trip } from "../api/types";
import { useAuth } from "../context/AuthContext";
import { buildApiUrl, clearInstanceStorage, getActiveInstance, useActiveInstance } from "../lib/instances";
import {
  completeOperation,
  countPendingCreates,
  keepOperationAsDraft,
  listQueuedCreates,
  setOperationSyncing,
  subscribeOfflineStore,
} from "./storage";
import {
  getConnectionState,
  setConnectionState,
  subscribeConnectionState,
  type ConnectionState,
} from "./networkState";

const HEALTH_INTERVAL_MS = 30_000;
const PREFETCH_INTERVAL_MS = 5 * 60_000;
let lastPrefetchOwner = "";
let lastPrefetchAt = 0;

interface SyncContextValue {
  connection: ConnectionState;
  pendingCount: number;
  syncing: boolean;
  refresh: () => void;
}

const SyncContext = createContext<SyncContextValue>({
  connection: "checking",
  pendingCount: 0,
  syncing: false,
  refresh: () => {},
});

export function SyncProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const instance = useActiveInstance();
  const connection = useSyncExternalStore(
    subscribeConnectionState,
    getConnectionState,
    getConnectionState,
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const refreshPending = useCallback(() => {
    void countPendingCreates().then(setPendingCount);
  }, []);

  useEffect(() => {
    refreshPending();
    if (user) clearInstanceStorage("groups");
    return subscribeOfflineStore(refreshPending);
  }, [refreshPending, user, instance.baseUrl]);

  const checkAndSync = useCallback(async () => {
    if (!user || !getToken()) return;
    try {
      const response = await fetch(buildApiUrl(getActiveInstance().baseUrl, "/api/health"), {
        method: "GET",
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setConnectionState("online");
    } catch {
      setConnectionState("offline");
      return;
    }

    const owner = `${instance.kind}:${instance.baseUrl}:${user.id}`;
    const pending = await countPendingCreates();
    const shouldPrefetch = owner !== lastPrefetchOwner
      || Date.now() - lastPrefetchAt >= PREFETCH_INTERVAL_MS;
    if (!shouldPrefetch && pending === 0) return;

    setSyncing(true);
    try {
      if (shouldPrefetch) {
        await prefetchAllUserData();
        lastPrefetchOwner = owner;
        lastPrefetchAt = Date.now();
      }
      await flushCreateQueue();
    } finally {
      setSyncing(false);
      refreshPending();
    }
  }, [user, instance.kind, instance.baseUrl, refreshPending]);

  useEffect(() => {
    if (!user) return;
    void checkAndSync();
    const interval = window.setInterval(() => void checkAndSync(), HEALTH_INTERVAL_MS);
    const wake = () => void checkAndSync();
    const visibility = () => {
      if (document.visibilityState === "visible") wake();
    };
    window.addEventListener("online", wake);
    window.addEventListener("focus", wake);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("online", wake);
      window.removeEventListener("focus", wake);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [user, instance.baseUrl, refreshNonce, checkAndSync]);

  const value = useMemo<SyncContextValue>(() => ({
    connection,
    pendingCount,
    syncing,
    refresh: () => {
      lastPrefetchAt = 0;
      setRefreshNonce((value) => value + 1);
    },
  }), [connection, pendingCount, syncing]);

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useOfflineSync(): SyncContextValue {
  return useContext(SyncContext);
}

export function SyncStatusIndicator() {
  const { t } = useTranslation();
  const { connection, pendingCount, syncing, refresh } = useOfflineSync();
  let label = t("offline.synced");
  let icon = <Wifi className="h-4 w-4" />;
  let tone = "text-emerald-700 dark:text-emerald-300";

  if (connection === "offline") {
    label = t("offline.offline");
    icon = <WifiOff className="h-4 w-4" />;
    tone = "text-amber-700 dark:text-amber-300";
  } else if (syncing || connection === "checking") {
    label = t("offline.syncing");
    icon = <RefreshCw className="h-4 w-4 animate-spin" />;
    tone = "text-sky-700 dark:text-sky-300";
  } else if (pendingCount > 0) {
    label = t("offline.onlineWaiting", { count: pendingCount });
    icon = <Upload className="h-4 w-4" />;
    tone = "text-amber-700 dark:text-amber-300";
  }

  return (
    <button
      type="button"
      onClick={refresh}
      className={`inline-flex min-h-9 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 text-xs font-medium dark:bg-slate-800 ${tone}`}
      title={label}
      aria-label={label}
    >
      {icon}
      <span className="hidden max-w-44 truncate md:inline">{label}</span>
    </button>
  );
}

async function flushCreateQueue(): Promise<void> {
  const operations = await listQueuedCreates();
  for (const operation of operations) {
    if (operation.state === "draft") continue;
    await setOperationSyncing(operation.id, true);
    let response: Response;
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Friendflow-App-Version": __APP_VERSION__,
        "X-Friendflow-Operation-Id": operation.id,
      };
      const token = getToken();
      if (token) headers.Authorization = `Bearer ${token}`;
      response = await fetch(
        buildApiUrl(getActiveInstance().baseUrl, operation.payload.path),
        {
          method: "POST",
          headers,
          body: JSON.stringify(operation.payload.body),
        },
      );
      setConnectionState("online");
    } catch {
      await setOperationSyncing(operation.id, false);
      setConnectionState("offline");
      return;
    }

    const text = await response.text();
    const data = text ? safeJson(text) : null;
    if (response.ok) {
      await completeOperation(operation.id, data);
      continue;
    }
    if (response.status >= 500 || response.status === 429) {
      await setOperationSyncing(operation.id, false);
      return;
    }
    const reason = data && typeof data === "object" && typeof (data as { error?: unknown }).error === "string"
      ? String((data as { error: string }).error)
      : `HTTP ${response.status}`;
    await keepOperationAsDraft(operation.id, reason);
  }
}

async function prefetchAllUserData(): Promise<void> {
  const groups = await api<GroupSummary[]>("/api/groups").catch(() => []);
  await Promise.all([
    fetchOptional("/api/me/calendar/events"),
    fetchOptional("/api/me/calendar/categories"),
    fetchOptional("/api/me/tasks"),
    prefetchShopping("/api/me/shopping"),
    ...groups.map((group) => prefetchGroup(group.id)),
  ]);
}

async function prefetchGroup(groupId: string): Promise<void> {
  const root = `/api/groups/${groupId}`;
  const [trips, tournaments] = await Promise.all([
    api<Trip[]>(`${root}/trips`).catch(() => []),
    api<TournamentSummary[]>(`${root}/games/tournaments`).catch(() => []),
    fetchOptional(root),
    fetchOptional(`${root}/calendar/events`),
    fetchOptional(`${root}/calendar/categories`),
    fetchOptional(`${root}/tasks`),
    prefetchShopping(`${root}/shopping`),
    fetchOptional(`${root}/splitwise/summary`),
    fetchOptional(`${root}/splitwise/expenses`),
    fetchOptional(`${root}/splitwise/payments`),
  ]);

  await Promise.all([
    ...trips.flatMap((trip) => [
      fetchOptional(`${root}/trips/${trip.id}`),
      fetchOptional(`${root}/trips/${trip.id}/links`),
      fetchOptional(`${root}/trips/${trip.id}/folders`),
      fetchOptional(`${root}/trips/${trip.id}/packing`),
      fetchOptional(`${root}/trips/${trip.id}/itinerary`),
    ]),
    ...tournaments.map((tournament) =>
      fetchOptional(`${root}/games/tournaments/${tournament.id}`)),
  ]);
}

async function prefetchShopping(root: string): Promise<void> {
  const lists = await api<ShoppingList[]>(`${root}/lists`).catch(() => []);
  await Promise.all(lists.map((list) => fetchOptional(`${root}/lists/${list.id}/items`)));
}

async function fetchOptional(path: string): Promise<void> {
  await api<unknown>(path).then(() => undefined).catch(() => undefined);
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
