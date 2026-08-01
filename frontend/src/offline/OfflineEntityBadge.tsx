import { FilePenLine, RefreshCw, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { OfflineEntityMeta } from "./storage";
import { useLocalEntityMeta } from "./useLocalEntityMeta";

export default function OfflineEntityBadge({ entity }: { entity: OfflineEntityMeta & { id?: string } }) {
  const { t } = useTranslation();
  const meta = useLocalEntityMeta(entity.id, entity);

  if (!meta.local_sync_state) return null;
  const syncing = meta.local_sync_state === "syncing";
  const draft = meta.local_sync_state === "draft";
  const label = draft
    ? t("offline.localDraft")
    : syncing
      ? t("offline.syncingItem")
      : t("offline.pending");

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950/60 dark:text-amber-200"
      title={meta.local_sync_error || label}
      aria-label={meta.local_sync_error || label}
    >
      {syncing
        ? <RefreshCw className="h-3 w-3 animate-spin" />
        : draft
          ? <FilePenLine className="h-3 w-3" />
          : <Upload className="h-3 w-3" />}
      {label}
    </span>
  );
}
