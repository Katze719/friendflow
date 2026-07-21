import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme, type ThemePreference } from "../context/ThemeContext";

const OPTIONS: { value: ThemePreference; icon: typeof Sun; labelKey: string }[] = [
  { value: "light", icon: Sun, labelKey: "theme.light" },
  { value: "dark", icon: Moon, labelKey: "theme.dark" },
  { value: "system", icon: Monitor, labelKey: "theme.system" },
];

export default function ThemeSwitcher({ full = false }: { full?: boolean }) {
  const { t } = useTranslation();
  const { preference, setPreference } = useTheme();

  return (
    <div
      className={full ? "grid grid-cols-3 gap-2" : "inline-flex items-center gap-1"}
      role="group"
      aria-label={t("theme.aria")}
    >
      <div className={full ? "contents" : "segmented"}>
        {OPTIONS.map(({ value, icon: Icon, labelKey }) => {
          const active = preference === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setPreference(value)}
              aria-pressed={active}
              title={t(labelKey)}
              aria-label={t(labelKey)}
              className={full
                ? `flex min-h-12 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "border-brand-500 bg-brand-600 text-white ring-2 ring-brand-500/20"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  }`
                : `segmented-item-compact ${
                    active ? "segmented-item-active" : "segmented-item-idle"
                  }`
              }
            >
              <Icon className="h-3.5 w-3.5" />
              {full ? <span>{t(labelKey)}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
