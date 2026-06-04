import { Plus, UserPlus, Users } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { Member } from "../../api/types";

/**
 * Shared control for adding people to a draw or tournament: a guest-name
 * input, an "add all members" button, and tappable chips for individual
 * members that aren't in yet. Used by both the wheel and tournament setup.
 */
export default function ParticipantPicker({
  members,
  isMemberAdded,
  onAddMember,
  onAddAllMembers,
  onAddGuest,
  disabled = false,
}: {
  members: Member[];
  isMemberAdded: (memberId: string) => boolean;
  onAddMember: (member: Member) => void;
  onAddAllMembers: () => void;
  onAddGuest: (name: string) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const [guest, setGuest] = useState("");

  const remaining = members.filter((m) => !isMemberAdded(m.id));

  function submitGuest(e: FormEvent) {
    e.preventDefault();
    const name = guest.trim();
    if (!name) return;
    onAddGuest(name);
    setGuest("");
  }

  return (
    <div className="space-y-3">
      <form onSubmit={submitGuest} className="flex gap-2">
        <input
          className="input"
          value={guest}
          onChange={(e) => setGuest(e.target.value)}
          placeholder={t("games.picker.guestPlaceholder")}
          maxLength={80}
          disabled={disabled}
        />
        <button
          type="submit"
          className="btn-secondary shrink-0"
          disabled={disabled || !guest.trim()}
        >
          <UserPlus className="h-4 w-4" />
          <span className="hidden sm:inline">{t("games.picker.addGuest")}</span>
        </button>
      </form>

      <button
        type="button"
        className="btn-secondary w-full"
        onClick={onAddAllMembers}
        disabled={disabled || remaining.length === 0}
      >
        <Users className="h-4 w-4" />
        {remaining.length === 0
          ? t("games.picker.allAdded")
          : t("games.picker.addAllMembers")}
      </button>

      {remaining.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {remaining.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onAddMember(m)}
              disabled={disabled}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:border-brand-400 hover:bg-brand-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-brand-600 dark:hover:bg-slate-800"
            >
              <Plus className="h-3.5 w-3.5 text-brand-500" />
              {m.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
