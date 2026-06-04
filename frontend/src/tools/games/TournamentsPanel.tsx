import { ListChecks, Plus, Swords, Trash2, Trophy } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../../api/client";
import type {
  TournamentFormat,
  TournamentStatus,
  TournamentSummary,
} from "../../api/types";
import LoadingState from "../../components/LoadingState";
import { useConfirm, useToast } from "../../ui/UIProvider";
import { gamesApi } from "./api";

export default function TournamentsPanel({ groupId }: { groupId: string }) {
  const { t } = useTranslation();
  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<TournamentSummary[] | null>(
    null,
  );
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    gamesApi
      .list(groupId)
      .then(setTournaments)
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : t("common.error")),
      );
  }, [groupId, t]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function onDelete(tournament: TournamentSummary) {
    const ok = await confirm({
      title: t("games.tournaments.deleteTitle"),
      message: t("games.tournaments.deleteConfirm", { name: tournament.name }),
      confirmLabel: t("common.delete"),
      variant: "danger",
    });
    if (!ok) return;
    try {
      await gamesApi.remove(groupId, tournament.id);
      toast.success(t("games.tournaments.deleted"));
      reload();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("common.error"));
    }
  }

  if (error && !tournaments) return <p className="alert-error">{error}</p>;
  if (!tournaments) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">{t("games.tournaments.title")}</h3>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setShowForm((v) => !v)}
          aria-expanded={showForm}
        >
          <Plus className="h-4 w-4" />
          {t("games.tournaments.newTournament")}
        </button>
      </div>

      {showForm && (
        <NewTournamentForm
          groupId={groupId}
          onCancel={() => setShowForm(false)}
          onCreated={(id) => navigate(`/groups/${groupId}/games/tournaments/${id}`)}
        />
      )}

      {tournaments.length === 0 ? (
        <div className="card p-8 text-center">
          <Trophy className="mx-auto h-10 w-10 text-slate-400 dark:text-slate-500" />
          <h4 className="mt-3 text-lg font-semibold">
            {t("games.tournaments.emptyTitle")}
          </h4>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("games.tournaments.emptyHint")}
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {tournaments.map((tournament) => (
            <TournamentCard
              key={tournament.id}
              tournament={tournament}
              onOpen={() =>
                navigate(`/groups/${groupId}/games/tournaments/${tournament.id}`)
              }
              onDelete={() => onDelete(tournament)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

const STATUS_STYLES: Record<TournamentStatus, string> = {
  setup: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  active: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  completed:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
};

function TournamentCard({
  tournament,
  onOpen,
  onDelete,
}: {
  tournament: TournamentSummary;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const FormatIcon = tournament.format === "elimination" ? Swords : ListChecks;
  return (
    <li className="group card relative flex flex-col p-0">
      <button
        type="button"
        onClick={onOpen}
        className="flex flex-1 flex-col gap-3 p-5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
      >
        <div className="flex items-start gap-2 pr-8">
          <FormatIcon
            className="mt-0.5 h-5 w-5 shrink-0 text-brand-500"
            aria-hidden
          />
          <h4 className="min-w-0 flex-1 truncate text-lg font-semibold">
            {tournament.name}
          </h4>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span
            className={`rounded-full px-2 py-0.5 font-semibold uppercase tracking-wide ${STATUS_STYLES[tournament.status]}`}
          >
            {t(`games.status.${tournament.status}`)}
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            {t(`games.format.${tournament.format}`)}
          </span>
          {tournament.team_mode && (
            <span className="text-slate-500 dark:text-slate-400">
              · {t("games.detail.teamModeOn")}
            </span>
          )}
          <span className="text-slate-500 dark:text-slate-400">
            · {t("games.participants.count", { count: tournament.participant_count })}
          </span>
        </div>
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="btn-ghost absolute right-2 top-2 h-7 px-2 text-slate-400 transition-colors hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400"
        aria-label={t("common.delete")}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}

function NewTournamentForm({
  groupId,
  onCancel,
  onCreated,
}: {
  groupId: string;
  onCancel: () => void;
  onCreated: (id: string) => void;
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const [name, setName] = useState("");
  const [format, setFormat] = useState<TournamentFormat>("points");
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const created = await gamesApi.create(groupId, {
        name: trimmed,
        format,
        team_mode: false,
      });
      onCreated(created.id);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-5">
      <div className="space-y-1">
        <label className="label" htmlFor="tournament_name">
          {t("games.tournaments.nameLabel")}
        </label>
        <input
          id="tournament_name"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("games.tournaments.namePlaceholder")}
          maxLength={120}
          required
          autoFocus
        />
      </div>

      <div className="space-y-1">
        <span className="label">{t("games.tournaments.formatLabel")}</span>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <FormatOption
            active={format === "points"}
            title={t("games.tournaments.formatPoints")}
            hint={t("games.tournaments.formatPointsHint")}
            icon={<ListChecks className="h-4 w-4" />}
            onClick={() => setFormat("points")}
          />
          <FormatOption
            active={format === "elimination"}
            title={t("games.tournaments.formatElimination")}
            hint={t("games.tournaments.formatEliminationHint")}
            icon={<Swords className="h-4 w-4" />}
            onClick={() => setFormat("elimination")}
          />
        </div>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        {t("games.tournaments.teamsLaterHint")}
      </p>

      <div className="flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={onCancel}>
          {t("common.cancel")}
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          <Plus className="h-4 w-4" />
          {saving ? t("common.saving") : t("games.tournaments.create")}
        </button>
      </div>
    </form>
  );
}

function FormatOption({
  active,
  title,
  hint,
  icon,
  onClick,
}: {
  active: boolean;
  title: string;
  hint: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col gap-1 rounded-lg border p-3 text-left transition ${
        active
          ? "border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-900/20"
          : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
      }`}
    >
      <span className="inline-flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </span>
      <span className="text-xs text-slate-500 dark:text-slate-400">{hint}</span>
    </button>
  );
}
