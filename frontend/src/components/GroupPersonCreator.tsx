import { UserPlus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ApiError } from "../api/client";
import { groupsApi } from "../api/groups";
import type { GroupPerson } from "../api/types";

export default function GroupPersonCreator({
  groupId,
  onCreated,
}: {
  groupId: string;
  onCreated: (person: GroupPerson) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (saving) return;
    const displayName = name.trim();
    if (!displayName) return;
    setSaving(true);
    setError(null);
    try {
      const person = await groupsApi.createPerson(groupId, displayName);
      onCreated(person);
      setName("");
      setOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className="btn-secondary" onClick={() => setOpen(true)}>
        <UserPlus className="h-4 w-4" /> {t("group.people.add")}
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
      <label className="label" htmlFor={`guest-name-${groupId}`}>
        {t("group.people.name")}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id={`guest-name-${groupId}`}
          className="input flex-1"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.stopPropagation();
              void submit();
            }
          }}
          maxLength={80}
          autoFocus
          required
          placeholder={t("group.people.placeholder")}
        />
        <button
          type="button"
          className="btn-primary"
          disabled={saving || !name.trim()}
          onClick={() => void submit()}
        >
          {saving ? t("common.saving") : t("group.people.addShort")}
        </button>
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>
          {t("common.cancel")}
        </button>
      </div>
      {error && <p className="alert-error">{error}</p>}
    </div>
  );
}
