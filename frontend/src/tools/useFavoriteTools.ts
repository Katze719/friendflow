import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "friendflow.favoriteTools";
const SHORTCUTS_STORAGE_KEY = "friendflow.homeToolShortcuts";

function readFavorites(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((v): v is string => typeof v === "string"));
  } catch {
    return new Set();
  }
}

function writeFavorites(favorites: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]));
  } catch {
    /* storage may be full or disabled; nothing we can do */
  }
}

export interface HomeToolShortcut {
  groupId: string;
  toolId: string;
  addedAt: string;
}

function shortcutKey(groupId: string, toolId: string): string {
  return `${groupId}:${toolId}`;
}

function readShortcuts(): HomeToolShortcut[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SHORTCUTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isShortcut);
  } catch {
    return [];
  }
}

function writeShortcuts(shortcuts: HomeToolShortcut[]): void {
  try {
    localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(shortcuts));
  } catch {
    /* storage may be full or disabled; nothing we can do */
  }
}

function isShortcut(value: unknown): value is HomeToolShortcut {
  if (!value || typeof value !== "object") return false;
  const candidate = value as HomeToolShortcut;
  return (
    typeof candidate.groupId === "string" &&
    typeof candidate.toolId === "string" &&
    typeof candidate.addedAt === "string"
  );
}

/**
 * Per-browser favorites for tool tiles. Kept in localStorage so the choice
 * survives reloads, and synced across tabs via the native `storage` event.
 */
export function useFavoriteTools() {
  const [favorites, setFavorites] = useState<Set<string>>(() => readFavorites());
  const [shortcuts, setShortcuts] = useState<HomeToolShortcut[]>(() =>
    readShortcuts(),
  );

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY) setFavorites(readFavorites());
      if (event.key === SHORTCUTS_STORAGE_KEY) setShortcuts(readShortcuts());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggle = useCallback((toolId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(toolId)) next.delete(toolId);
      else next.add(toolId);
      writeFavorites(next);
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (toolId: string) => favorites.has(toolId),
    [favorites],
  );

  const toggleShortcut = useCallback((groupId: string, toolId: string) => {
    setShortcuts((prev) => {
      const key = shortcutKey(groupId, toolId);
      const exists = prev.some(
        (item) => shortcutKey(item.groupId, item.toolId) === key,
      );
      const next = exists
        ? prev.filter((item) => shortcutKey(item.groupId, item.toolId) !== key)
        : [{ groupId, toolId, addedAt: new Date().toISOString() }, ...prev];
      writeShortcuts(next);
      return next;
    });
  }, []);

  const isShortcut = useCallback(
    (groupId: string, toolId: string) =>
      shortcuts.some(
        (item) =>
          item.groupId === groupId &&
          item.toolId === toolId,
      ),
    [shortcuts],
  );

  return { favorites, shortcuts, toggle, isFavorite, toggleShortcut, isShortcut };
}
