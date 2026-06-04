import { CornerDownLeft, Plus, Shuffle, Trash2, Users, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ApiError } from "../../api/client";
import type { TournamentDetail, TournamentParticipant } from "../../api/types";
import { useToast } from "../../ui/UIProvider";
import { gamesApi } from "./api";

/**
 * Team assignment for a tournament in `setup` with `team_mode` on. Supports
 * the randomizer plus manual tap-to-move (tap a person, then a team or the
 * bench) and adding/removing teams to resize them by hand.
 */
export default function AssignmentBoard({
  groupId,
  detail,
  onUpdated,
}: {
  groupId: string;
  detail: TournamentDetail;
  onUpdated: (next: TournamentDetail) => void;
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const bench = detail.participants.filter((p) => p.team_id === null);
  const byId = new Map(detail.participants.map((p) => [p.id, p]));

  async function run(fn: () => Promise<TournamentDetail>) {
    setBusy(true);
    try {
      const next = await fn();
      onUpdated(next);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  function move(participantId: string, teamId: string | null) {
    setSelected(null);
    run(() =>
      gamesApi.updateParticipant(groupId, detail.id, participantId, teamId),
    );
  }

  function onTargetClick(teamId: string | null) {
    if (!selected) return;
    const current = byId.get(selected);
    if (current && current.team_id === teamId) {
      setSelected(null);
      return;
    }
    move(selected, teamId);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">{t("games.teams.title")}</h3>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => run(() => gamesApi.createTeam(groupId, detail.id))}
            disabled={busy}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t("games.teams.addTeam")}</span>
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => run(() => gamesApi.randomize(groupId, detail.id))}
            disabled={busy || detail.participants.length === 0}
          >
            <Shuffle className="h-4 w-4" />
            {busy ? t("games.teams.randomizing") : t("games.teams.randomize")}
          </button>
        </div>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        {selected
          ? t("games.teams.moveSelectedHint", {
              name: byId.get(selected)?.display_name ?? "",
            })
          : t("games.teams.moveHint")}
      </p>

      {/* Bench */}
      <BenchCard
        bench={bench}
        selected={selected}
        busy={busy}
        onSelect={setSelected}
        onTarget={() => onTargetClick(null)}
      />

      {/* Teams */}
      {detail.teams.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          {t("games.teams.empty")}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {detail.teams.map((team) => {
            const members = team.member_ids
              .map((id) => byId.get(id))
              .filter((p): p is TournamentParticipant => Boolean(p));
            return (
              <div
                key={team.id}
                className={`card space-y-3 p-4 ${
                  selected ? "ring-2 ring-brand-200 dark:ring-brand-800" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2 font-semibold">
                    <Users className="h-4 w-4 text-brand-500" />
                    {team.name}
                    <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                      {t("games.teams.playerCount", { count: members.length })}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      run(() => gamesApi.removeTeam(groupId, detail.id, team.id))
                    }
                    disabled={busy}
                    className="rounded p-1 text-slate-400 transition hover:text-rose-600 disabled:opacity-50"
                    aria-label={t("games.teams.removeTeam")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {members.map((p) => (
                    <TeamMemberChip
                      key={p.id}
                      name={p.display_name}
                      active={selected === p.id}
                      disabled={busy}
                      onSelect={() =>
                        setSelected((s) => (s === p.id ? null : p.id))
                      }
                      onBench={() => move(p.id, null)}
                    />
                  ))}
                  {members.length === 0 && (
                    <span className="text-sm italic text-slate-400 dark:text-slate-500">
                      {t("games.teams.teamEmpty")}
                    </span>
                  )}
                </div>

                {selected && byId.get(selected)?.team_id !== team.id && (
                  <button
                    type="button"
                    className="btn-secondary w-full"
                    onClick={() => onTargetClick(team.id)}
                    disabled={busy}
                  >
                    {t("games.teams.moveHere")}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BenchCard({
  bench,
  selected,
  busy,
  onSelect,
  onTarget,
}: {
  bench: TournamentParticipant[];
  selected: string | null;
  busy: boolean;
  onSelect: (id: string | null) => void;
  onTarget: () => void;
}) {
  const { t } = useTranslation();
  const selectedOnTeam =
    selected !== null && !bench.some((p) => p.id === selected);
  return (
    <div className="card space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {t("games.teams.bench")}
        </h4>
      </div>
      {selectedOnTeam && (
        <button
          type="button"
          className="btn-secondary w-full"
          onClick={onTarget}
          disabled={busy}
        >
          <CornerDownLeft className="h-4 w-4" />
          {t("games.teams.moveToBench")}
        </button>
      )}
      {bench.length === 0 ? (
        <p className="text-sm italic text-slate-400 dark:text-slate-500">
          {t("games.teams.benchEmpty")}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {bench.map((p) => (
            <PersonChip
              key={p.id}
              name={p.display_name}
              active={selected === p.id}
              disabled={busy}
              onClick={() => onSelect(selected === p.id ? null : p.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PersonChip({
  name,
  active,
  disabled,
  onClick,
}: {
  name: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm transition disabled:opacity-50 ${
        active
          ? "bg-brand-600 text-white"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      }`}
    >
      {name}
      {active && <X className="h-3.5 w-3.5" />}
    </button>
  );
}

/**
 * A person on a team: tap the name to select for a move, or tap the inline
 * bench button to send them straight back to the bench in one tap.
 */
function TeamMemberChip({
  name,
  active,
  disabled,
  onSelect,
  onBench,
}: {
  name: string;
  active: boolean;
  disabled: boolean;
  onSelect: () => void;
  onBench: () => void;
}) {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex items-center overflow-hidden rounded-full text-sm transition ${
        active
          ? "bg-brand-600 text-white"
          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        disabled={disabled}
        className="py-1.5 pl-3 pr-1.5 disabled:opacity-50"
      >
        {name}
      </button>
      <button
        type="button"
        onClick={onBench}
        disabled={disabled}
        aria-label={t("games.teams.moveToBench")}
        title={t("games.teams.moveToBench")}
        className={`flex h-full items-center py-1.5 pl-1 pr-2 transition disabled:opacity-50 ${
          active
            ? "hover:bg-brand-700"
            : "text-slate-400 hover:bg-slate-200 hover:text-rose-600 dark:hover:bg-slate-700"
        }`}
      >
        <CornerDownLeft className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}
