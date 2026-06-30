import { Globe, LoaderCircle, Server, X } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useAuthConfig } from "../lib/authConfig";
import {
  fetchAuthConfigForBaseUrl,
  getActiveInstance,
  getDefaultInstance,
  getInstanceDisplayHost,
  hasConfiguredDefaultInstance,
  isDefaultInstance,
  normalizeCustomInstanceUrl,
  resetToDefaultInstance,
  setActiveInstance,
  useActiveInstance,
} from "../lib/instances";

export default function InstanceSwitcher() {
  const { t } = useTranslation();
  const activeInstance = useActiveInstance();
  const authConfig = useAuthConfig();
  const [open, setOpen] = useState(false);

  const activeLabel = useMemo(() => {
    if (activeInstance.kind === "custom") return activeInstance.label;
    return authConfig?.instance_name?.trim() || getDefaultInstance().label;
  }, [activeInstance.kind, activeInstance.label, authConfig?.instance_name]);

  return (
    <>
      <button
        type="button"
        className="btn-ghost h-9 px-3 text-xs"
        onClick={() => setOpen(true)}
        aria-label={t("auth.instance.switchAction")}
      >
        <Server className="h-4 w-4" />
        <span>
          {activeInstance.kind === "custom"
            ? t("auth.instance.currentAction", { label: activeLabel })
            : t("auth.instance.switchAction")}
        </span>
      </button>
      {open && (
        <InstanceSwitcherDialog
          activeLabel={activeLabel}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function InstanceSwitcherDialog({
  activeLabel,
  onClose,
}: {
  activeLabel: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const activeInstance = useActiveInstance();
  const defaultInstance = getDefaultInstance();
  const [customUrl, setCustomUrl] = useState(
    activeInstance.kind === "custom" ? activeInstance.baseUrl : "",
  );
  const [customAcknowledged, setCustomAcknowledged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCustomUrl(activeInstance.kind === "custom" ? activeInstance.baseUrl : "");
    setCustomAcknowledged(false);
  }, [activeInstance.baseUrl, activeInstance.kind]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;

    const normalized = normalizeCustomInstanceUrl(customUrl);
    if (!normalized) {
      setError(t("auth.instance.invalidUrl"));
      return;
    }
    if (!customAcknowledged) {
      setError(t("auth.instance.ackRequired"));
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const cfg = await fetchAuthConfigForBaseUrl(normalized);
      setActiveInstance({
        kind: "custom",
        label: cfg.instance_name?.trim() || getInstanceDisplayHost(normalized),
        baseUrl: normalized,
      });
      onClose();
    } catch {
      setError(t("auth.instance.unreachable"));
    } finally {
      setSaving(false);
    }
  }

  function useDefaultInstance() {
    resetToDefaultInstance();
    onClose();
  }

  const defaultLabel = defaultInstance.label;
  const defaultHost = defaultInstance.baseUrl ? getInstanceDisplayHost(defaultInstance.baseUrl) : null;
  const currentHost =
    activeInstance.kind === "custom"
      ? getInstanceDisplayHost(activeInstance.baseUrl)
      : defaultHost;

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/60 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="instance-switcher-title"
      onClick={onClose}
    >
      <div
        className="card my-auto w-full max-w-lg space-y-5 p-6 shadow-2xl sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 id="instance-switcher-title" className="text-lg font-semibold sm:text-xl">
              {t("auth.instance.title")}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("auth.instance.subtitle")}
            </p>
          </div>
          <button
            type="button"
            className="btn-ghost -mr-2 -mt-2 shrink-0"
            onClick={onClose}
            aria-label={t("common.close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm dark:border-slate-700 dark:bg-slate-950/40">
          <p className="label">{t("auth.instance.activeLabel")}</p>
          <p className="mt-2 font-medium text-slate-900 dark:text-slate-100">{activeLabel}</p>
          {currentHost && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{currentHost}</p>
          )}
        </div>

        <section className="space-y-3">
          <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                  <p className="font-medium text-slate-900 dark:text-slate-100">{defaultLabel}</p>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t("auth.instance.defaultHint")}
                </p>
                {defaultHost && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">{defaultHost}</p>
                )}
              </div>
              <button
                type="button"
                className={isDefaultInstance(getActiveInstance()) ? "btn-secondary" : "btn-primary"}
                onClick={useDefaultInstance}
                disabled={!hasConfiguredDefaultInstance()}
              >
                {isDefaultInstance(getActiveInstance())
                  ? t("auth.instance.defaultSelected")
                  : t("auth.instance.useDefault", { label: defaultLabel })}
              </button>
            </div>
          </div>

          <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"
          >
            <div className="space-y-1">
              <label className="label" htmlFor="custom_instance_url">
                {t("auth.instance.customLabel")}
              </label>
              <input
                id="custom_instance_url"
                type="url"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="input"
                placeholder="https://my-friendflow.example"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("auth.instance.customHint")}
              </p>
            </div>

            <label className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-100">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 shrink-0 rounded border-amber-300 text-brand-600 focus:ring-brand-500"
                checked={customAcknowledged}
                onChange={(e) => setCustomAcknowledged(e.target.checked)}
              />
              <span>{t("auth.instance.customAcknowledgement")}</span>
            </label>

            {error && <p className="alert-error mt-4">{error}</p>}

            <div className="mt-4 flex justify-end">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    <span>{t("auth.instance.validating")}</span>
                  </>
                ) : (
                  t("auth.instance.useCustom")
                )}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>,
    document.body,
  );
}
