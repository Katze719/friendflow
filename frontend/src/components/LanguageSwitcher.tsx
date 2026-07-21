import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "../i18n";

const LABELS: Record<SupportedLanguage, string> = {
  en: "EN",
  de: "DE",
  fr: "FR",
  es: "ES",
  it: "IT",
};

const NAMES: Record<SupportedLanguage, string> = {
  en: "English",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  it: "Italiano",
};

export default function LanguageSwitcher({ full = false }: { full?: boolean }) {
  const { i18n, t } = useTranslation();
  const current = (i18n.resolvedLanguage ?? i18n.language ?? "en").split("-")[0] as SupportedLanguage;

  if (full) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5" role="radiogroup" aria-label={t("common.language")}>
        {SUPPORTED_LANGUAGES.map((lng) => {
          const active = lng === current;
          return (
            <button
              key={lng}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => void i18n.changeLanguage(lng)}
              className={`min-h-12 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                active
                  ? "border-brand-500 bg-brand-600 text-white ring-2 ring-brand-500/20"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              {NAMES[lng]}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1" role="group" aria-label={t("common.language")}>
      <Globe className="h-4 w-4 text-slate-400 dark:text-slate-500" aria-hidden />
      <label className="sr-only" htmlFor="header-language">{t("common.language")}</label>
      <select
        id="header-language"
        className="input-compact py-1"
        value={current}
        onChange={(event) => void i18n.changeLanguage(event.target.value)}
      >
        {SUPPORTED_LANGUAGES.map((lng) => <option key={lng} value={lng}>{LABELS[lng]}</option>)}
      </select>
    </div>
  );
}
