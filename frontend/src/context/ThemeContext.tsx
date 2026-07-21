import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";
export type AccentPreference =
  | "indigo"
  | "ocean"
  | "emerald"
  | "rose"
  | "lavender"
  | "sky"
  | "peach"
  | "pink";

const STORAGE_KEY = "friendflow.theme";
const ACCENT_STORAGE_KEY = "friendflow.accent";
const HEADER_ICON_STORAGE_KEY = "friendflow.headerIcon";
const ACCENT_THEME_COLORS: Record<AccentPreference, string> = {
  indigo: "#4f46e5",
  ocean: "#0369a1",
  emerald: "#047857",
  rose: "#be123c",
  lavender: "#7e22ce",
  sky: "#1d4ed8",
  peach: "#c2410c",
  pink: "#b5179e",
};

interface ThemeContextValue {
  /** User preference (what they selected). */
  preference: ThemePreference;
  /** Actually applied theme after resolving "system". */
  resolved: ResolvedTheme;
  setPreference: (pref: ThemePreference) => void;
  accent: AccentPreference;
  setAccent: (accent: AccentPreference) => void;
  showHeaderIcon: boolean;
  setShowHeaderIcon: (show: boolean) => void;
}

function readStoredAccent(): AccentPreference {
  try {
    const value = localStorage.getItem(ACCENT_STORAGE_KEY);
    if (
      value === "indigo" ||
      value === "ocean" ||
      value === "emerald" ||
      value === "rose" ||
      value === "lavender" ||
      value === "sky" ||
      value === "peach" ||
      value === "pink"
    ) {
      return value;
    }
  } catch {
    /* ignore */
  }
  return "indigo";
}

function readStoredHeaderIcon(): boolean {
  try {
    return localStorage.getItem(HEADER_ICON_STORAGE_KEY) !== "hidden";
  } catch {
    return true;
  }
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredPreference(): ThemePreference {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* ignore */
  }
  return "system";
}

function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function applyThemeClass(resolved: ResolvedTheme) {
  const root = document.documentElement;
  if (resolved === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  root.style.colorScheme = resolved;
}

function applyAccent(accent: AccentPreference) {
  document.documentElement.dataset.accent = accent;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", ACCENT_THEME_COLORS[accent]);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() =>
    readStoredPreference(),
  );
  const [resolved, setResolved] = useState<ResolvedTheme>(() =>
    preference === "system"
      ? systemPrefersDark()
        ? "dark"
        : "light"
      : preference,
  );
  const [accent, setAccentState] = useState<AccentPreference>(() => readStoredAccent());
  const [showHeaderIcon, setShowHeaderIconState] = useState<boolean>(() =>
    readStoredHeaderIcon(),
  );

  useEffect(() => {
    const next: ResolvedTheme =
      preference === "system"
        ? systemPrefersDark()
          ? "dark"
          : "light"
        : preference;
    setResolved(next);
    applyThemeClass(next);
  }, [preference]);

  useEffect(() => {
    applyAccent(accent);
  }, [accent]);

  useEffect(() => {
    if (preference !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const next: ResolvedTheme = mql.matches ? "dark" : "light";
      setResolved(next);
      applyThemeClass(next);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [preference]);

  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref);
    try {
      localStorage.setItem(STORAGE_KEY, pref);
    } catch {
      /* ignore */
    }
  }, []);

  const setAccent = useCallback((nextAccent: AccentPreference) => {
    setAccentState(nextAccent);
    try {
      localStorage.setItem(ACCENT_STORAGE_KEY, nextAccent);
    } catch {
      /* ignore */
    }
  }, []);

  const setShowHeaderIcon = useCallback((show: boolean) => {
    setShowHeaderIconState(show);
    try {
      localStorage.setItem(HEADER_ICON_STORAGE_KEY, show ? "visible" : "hidden");
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({
      preference,
      resolved,
      setPreference,
      accent,
      setAccent,
      showHeaderIcon,
      setShowHeaderIcon,
    }),
    [preference, resolved, setPreference, accent, setAccent, showHeaderIcon, setShowHeaderIcon],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
