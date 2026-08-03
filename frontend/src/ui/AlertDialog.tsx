import { WifiOff } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export default function AlertDialog({ open, title, message, onClose }: Props) {
  const { t } = useTranslation();
  const titleId = useId();
  const descriptionId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Enter") {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center px-4 pb-safe sm:items-center sm:pb-0">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-slate-950/50 backdrop-blur-sm"
        aria-label={t("common.dismiss")}
        onClick={onClose}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative max-h-[calc(100%-max(1rem,var(--safe-area-top))-max(1rem,var(--safe-area-bottom)))] w-full max-w-sm overflow-y-auto overscroll-contain rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700 sm:p-6"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300">
            <WifiOff className="h-5 w-5" />
          </span>
          <div className="min-w-0 pt-0.5">
            <h2 id={titleId} className="font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </h2>
            <p id={descriptionId} className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {message}
            </p>
          </div>
        </div>
        <button ref={closeRef} type="button" className="btn-primary mt-5 w-full" onClick={onClose}>
          {t("common.dismiss")}
        </button>
      </div>
    </div>
  );
}
