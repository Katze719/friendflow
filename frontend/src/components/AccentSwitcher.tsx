import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  useTheme,
  type AccentPreference,
} from "../context/ThemeContext";

const OPTIONS: { value: AccentPreference; swatch: string }[] = [
  { value: "indigo", swatch: "bg-[#4f46e5]" },
  { value: "ocean", swatch: "bg-[#0369a1]" },
  { value: "emerald", swatch: "bg-[#047857]" },
  { value: "rose", swatch: "bg-[#be123c]" },
  { value: "lavender", swatch: "bg-[#c084fc]" },
  { value: "sky", swatch: "bg-[#60a5fa]" },
  { value: "peach", swatch: "bg-[#fb923c]" },
  { value: "pink", swatch: "bg-[#f65ac7]" },
];

export default function AccentSwitcher() {
  const { t } = useTranslation();
  const { accent, setAccent } = useTheme();

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label={t("theme.accentAria")}>
      {OPTIONS.map(({ value, swatch }) => {
        const active = accent === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setAccent(value)}
            className={`flex min-h-12 items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm font-medium transition ${
              active
                ? "border-brand-500 bg-brand-50 text-brand-800 ring-2 ring-brand-500/20 dark:bg-brand-900/30 dark:text-brand-100"
                : "border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            }`}
          >
            <span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${swatch}`}>
              {active ? <Check className="h-3.5 w-3.5 text-white" /> : null}
            </span>
            <span>{t(`theme.accents.${value}`)}</span>
          </button>
        );
      })}
    </div>
  );
}
