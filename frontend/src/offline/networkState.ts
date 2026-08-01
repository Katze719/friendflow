export type ConnectionState = "checking" | "online" | "offline";

let state: ConnectionState = typeof navigator !== "undefined" && navigator.onLine === false
  ? "offline"
  : "checking";
const listeners = new Set<() => void>();

export function getConnectionState(): ConnectionState {
  return state;
}

export function setConnectionState(next: ConnectionState): void {
  if (state === next) return;
  state = next;
  for (const listener of listeners) listener();
}

export function subscribeConnectionState(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

