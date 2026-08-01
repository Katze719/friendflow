const ONLINE_REQUIRED_EVENT = "friendflow:online-required";
let lastEmittedAt = 0;

export function emitOnlineRequired(): void {
  lastEmittedAt = Date.now();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ONLINE_REQUIRED_EVENT));
  }
}

export function subscribeOnlineRequired(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(ONLINE_REQUIRED_EVENT, listener);
  return () => window.removeEventListener(ONLINE_REQUIRED_EVENT, listener);
}

export function wasOnlineRequiredJustEmitted(): boolean {
  return Date.now() - lastEmittedAt < 1_000;
}
