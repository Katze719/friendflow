import { Check, Play, Trophy, Users, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { ApiError } from "../../api/client";
import { groupsApi } from "../../api/groups";
import type {
  GroupDetail,
  TournamentDetail,
  TournamentMatch,
} from "../../api/types";
import LoadingState from "../../components/LoadingState";
import PageHeader from "../../components/PageHeader";
import { useToast } from "../../ui/UIProvider";
import AssignmentBoard from "./AssignmentBoard";
import { gamesApi } from "./api";
import ParticipantPicker from "./ParticipantPicker";

export default function TournamentDetailPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const { groupId, tournamentId } = useParams<{
    groupId: string;
    tournamentId: string;
  }>();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [detail, setDetail] = useState<TournamentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const reload = useCallback(() => {
    if (!groupId || !tournamentId) return;
    Promise.all([
      groupsApi.get(groupId),
      gamesApi.get(groupId, tournamentId),
    ])
      .then(([g, d]) => {
        setGroup(g);
        setDetail(d);
      })
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : t("common.error")),
      );
  }, [groupId, tournamentId, t]);

  useEffect(() => {
    reload();
  }, [reload]);

  const entrantCount = useMemo(() => {
    if (!detail) return 0;
    if (detail.team_mode) {
      return detail.teams.filter((team) => team.member_ids.length > 0).length;
    }
    return detail.participants.length;
  }, [detail]);

  if (error && !detail) return <p className="alert-error">{error}</p>;
  if (!group || !detail || !groupId) return <LoadingState />;

  async function addParticipants(body: Parameters<typeof gamesApi.addParticipant>[2]) {
    if (!groupId || !detail) return;
    try {
      setDetail(await gamesApi.addParticipant(groupId, detail.id, body));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("common.error"));
    }
  }

  async function removeParticipant(pid: string) {
    if (!groupId || !detail) return;
    try {
      setDetail(await gamesApi.removeParticipant(groupId, detail.id, pid));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("common.error"));
    }
  }

  async function setTeamConfig(body: {
    team_mode: boolean;
    team_size?: number | null;
  }) {
    if (!groupId || !detail) return;
    try {
      setDetail(await gamesApi.update(groupId, detail.id, body));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("common.error"));
    }
  }

  async function start() {
    if (!groupId || !detail) return;
    setStarting(true);
    try {
      setDetail(await gamesApi.start(groupId, detail.id));
      toast.success(t("games.detail.started"));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("common.error"));
    } finally {
      setStarting(false);
    }
  }

  const isSetup = detail.status === "setup";

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        backLink={{
          to: `/groups/${group.id}/games`,
          label: t("games.detail.backToGames"),
        }}
        title={detail.name}
        subtitle={`${t(`games.format.${detail.format}`)} · ${t(
          `games.status.${detail.status}`,
        )}${detail.team_mode ? ` · ${t("games.detail.teamModeOn")}` : ""}`}
      />

      {isSetup ? (
        <>
          <section className="card space-y-4 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {t("games.participants.title")}
              </h3>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {t("games.participants.count", {
                  count: detail.participants.length,
                })}
              </span>
            </div>
            <ParticipantPicker
              members={group.members}
              isMemberAdded={(id) =>
                detail.participants.some((p) => p.user_id === id)
              }
              onAddMember={(m) => addParticipants({ user_id: m.id })}
              onAddAllMembers={() =>
                addParticipants({ user_ids: group.members.map((m) => m.id) })
              }
              onAddGuest={(name) => addParticipants({ display_name: name })}
            />
            {detail.participants.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {detail.participants.map((p) => (
                  <li
                    key={p.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-3 pr-1.5 text-sm dark:bg-slate-800"
                  >
                    {p.display_name}
                    {p.user_id === null && (
                      <span className="text-xs text-slate-400">
                        {t("games.participants.guest")}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeParticipant(p.id)}
                      className="rounded-full p-0.5 text-slate-400 transition hover:bg-slate-200 hover:text-rose-600 dark:hover:bg-slate-700"
                      aria-label={t("games.participants.remove")}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("games.participants.empty")}
              </p>
            )}
          </section>

          <TeamSetup detail={detail} onChange={setTeamConfig} />

          {detail.team_mode && (
            <section className="card p-4 sm:p-6">
              <AssignmentBoard
                groupId={groupId}
                detail={detail}
                onUpdated={setDetail}
              />
            </section>
          )}

          {/* Sticky start action - reachable with one thumb on mobile. */}
          <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur pb-safe px-safe dark:border-slate-800 dark:bg-slate-950/95">
            <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {entrantCount < 2
                  ? t("games.detail.needTwo")
                  : t("games.detail.entrantsReady", { count: entrantCount })}
              </span>
              <button
                type="button"
                className="btn-primary shrink-0"
                onClick={start}
                disabled={starting || entrantCount < 2}
              >
                <Play className="h-4 w-4" />
                {starting
                  ? t("games.detail.starting")
                  : t("games.detail.startTournament")}
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          {detail.team_mode && <TeamRoster detail={detail} />}
          {detail.format === "points" ? (
            <PointsView groupId={groupId} detail={detail} onUpdated={setDetail} />
          ) : (
            <BracketView
              groupId={groupId}
              detail={detail}
              onUpdated={setDetail}
            />
          )}
        </>
      )}
    </div>
  );
}

// ---------- team mode setup (toggle teams while adding people) ----------

function TeamSetup({
  detail,
  onChange,
}: {
  detail: TournamentDetail;
  onChange: (body: { team_mode: boolean; team_size?: number | null }) => void;
}) {
  const { t } = useTranslation();
  const [size, setSize] = useState(detail.team_size ?? 2);

  useEffect(() => {
    setSize(detail.team_size ?? 2);
  }, [detail.team_size]);

  function commitSize(value: number) {
    const next = Math.max(1, Math.min(50, value || 1));
    setSize(next);
    if (next !== detail.team_size) {
      onChange({ team_mode: true, team_size: next });
    }
  }

  return (
    <section className="card space-y-4 p-4 sm:p-6">
      <label className="flex cursor-pointer items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block text-lg font-semibold">
            {t("games.tournaments.teamsLabel")}
          </span>
          <span className="mt-0.5 block text-sm text-slate-500 dark:text-slate-400">
            {t("games.teams.modeHint")}
          </span>
        </span>
        <input
          type="checkbox"
          className="mt-1 h-5 w-5 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          checked={detail.team_mode}
          onChange={(e) =>
            onChange({ team_mode: e.target.checked, team_size: size })
          }
        />
      </label>

      {detail.team_mode && (
        <div className="space-y-1 border-t border-slate-100 pt-4 dark:border-slate-800">
          <label className="label" htmlFor="team_size">
            {t("games.tournaments.teamSizeLabel")}
          </label>
          <input
            id="team_size"
            type="number"
            min={1}
            max={50}
            inputMode="numeric"
            className="input w-28"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            onBlur={(e) => commitSize(Number(e.target.value))}
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("games.tournaments.teamSizeHint")}
          </p>
        </div>
      )}
    </section>
  );
}

// ---------- team roster (shown after start, read-only) ----------

function TeamRoster({ detail }: { detail: TournamentDetail }) {
  const { t } = useTranslation();
  const byId = new Map(detail.participants.map((p) => [p.id, p]));
  const teams = detail.teams.filter((team) => team.member_ids.length > 0);
  if (teams.length === 0) return null;

  return (
    <section className="card space-y-3 p-4 sm:p-6">
      <h3 className="text-lg font-semibold">{t("games.teams.title")}</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {teams.map((team) => (
          <div
            key={team.id}
            className="rounded-xl border border-slate-200 p-3 dark:border-slate-700"
          >
            <div className="mb-2 inline-flex items-center gap-2 font-semibold">
              <Users className="h-4 w-4 text-brand-500" />
              {team.name}
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                {t("games.teams.playerCount", { count: team.member_ids.length })}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {team.member_ids.map((id) => {
                const p = byId.get(id);
                if (!p) return null;
                return (
                  <span
                    key={id}
                    className="rounded-full bg-slate-100 px-2.5 py-1 text-sm dark:bg-slate-800"
                  >
                    {p.display_name}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------- points (round-robin) ----------

function PointsView({
  groupId,
  detail,
  onUpdated,
}: {
  groupId: string;
  detail: TournamentDetail;
  onUpdated: (next: TournamentDetail) => void;
}) {
  const { t } = useTranslation();
  const nameOf = useEntrantNames(detail);
  const rounds = useMemo(() => groupByRound(detail.matches), [detail.matches]);

  return (
    <div className="space-y-6">
      <section className="card overflow-hidden p-0">
        <h3 className="px-4 pt-4 text-lg font-semibold sm:px-6">
          {t("games.standings.title")}
        </h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[28rem] text-sm">
            <thead className="border-y border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-3 py-2 text-left font-medium">
                  {t("games.standings.rank")}
                </th>
                <th className="px-3 py-2 text-left font-medium">
                  {t("games.standings.entrant")}
                </th>
                <th className="px-2 py-2 text-center font-medium">
                  {t("games.standings.played")}
                </th>
                <th className="px-2 py-2 text-center font-medium">
                  {t("games.standings.won")}
                </th>
                <th className="px-2 py-2 text-center font-medium">
                  {t("games.standings.drawn")}
                </th>
                <th className="px-2 py-2 text-center font-medium">
                  {t("games.standings.lost")}
                </th>
                <th className="px-3 py-2 text-center font-semibold">
                  {t("games.standings.points")}
                </th>
              </tr>
            </thead>
            <tbody>
              {detail.standings.map((row, i) => (
                <tr
                  key={row.entrant_id}
                  className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                >
                  <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                  <td className="px-3 py-2 font-medium">{row.display_name}</td>
                  <td className="px-2 py-2 text-center">{row.played}</td>
                  <td className="px-2 py-2 text-center">{row.wins}</td>
                  <td className="px-2 py-2 text-center">{row.draws}</td>
                  <td className="px-2 py-2 text-center">{row.losses}</td>
                  <td className="px-3 py-2 text-center font-semibold">
                    {row.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h3 className="text-lg font-semibold">{t("games.matches.title")}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("games.matches.winHint")}
          </p>
        </div>
        {rounds.map(([round, matches]) => (
          <div key={round} className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t("games.matches.round", { n: round })}
            </h4>
            <div className="space-y-2">
              {matches.map((m) => (
                <MatchRow
                  key={m.id}
                  match={m}
                  nameOf={nameOf}
                  groupId={groupId}
                  tournamentId={detail.id}
                  onUpdated={onUpdated}
                />
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

// ---------- elimination (bracket) ----------

function BracketView({
  groupId,
  detail,
  onUpdated,
}: {
  groupId: string;
  detail: TournamentDetail;
  onUpdated: (next: TournamentDetail) => void;
}) {
  const { t } = useTranslation();
  const nameOf = useEntrantNames(detail);
  const rounds = useMemo(() => groupByRound(detail.matches), [detail.matches]);

  const champion =
    detail.status === "completed"
      ? (() => {
          const finalRound = rounds[rounds.length - 1];
          const finalMatch = finalRound?.[1]?.[0];
          return finalMatch?.winner_entrant_id
            ? nameOf(finalMatch.winner_entrant_id)
            : null;
        })()
      : null;

  return (
    <div className="space-y-4">
      {champion && (
        <div className="card flex items-center justify-center gap-2 p-4 text-lg font-semibold text-emerald-700 dark:text-emerald-300">
          <Trophy className="h-5 w-5" />
          {t("games.bracket.champion", { name: champion })}
        </div>
      )}
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-min gap-4">
          {rounds.map(([round, matches], idx) => (
            <div key={round} className="flex w-56 shrink-0 flex-col gap-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {idx === rounds.length - 1
                  ? t("games.bracket.final")
                  : t("games.matches.round", { n: round })}
              </h4>
              <div className="flex flex-1 flex-col justify-around gap-3">
                {matches.map((m) => (
                  <BracketMatch
                    key={m.id}
                    match={m}
                    nameOf={nameOf}
                    groupId={groupId}
                    tournamentId={detail.id}
                    onUpdated={onUpdated}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BracketMatch({
  match,
  nameOf,
  groupId,
  tournamentId,
  onUpdated,
}: {
  match: TournamentMatch;
  nameOf: (id: string | null) => string;
  groupId: string;
  tournamentId: string;
  onUpdated: (next: TournamentDetail) => void;
}) {
  const { t } = useTranslation();
  const { submit, saving } = useSubmitResult(
    groupId,
    tournamentId,
    match.id,
    onUpdated,
  );
  const isBye =
    match.status === "done" &&
    (match.entrant_a_id === null || match.entrant_b_id === null);
  const bothPresent =
    match.entrant_a_id !== null && match.entrant_b_id !== null;
  const done = match.status === "done";

  return (
    <div className="card overflow-hidden p-0 text-sm">
      <BracketSlot
        name={
          match.entrant_a_id ? nameOf(match.entrant_a_id) : t("games.matches.tbd")
        }
        winner={
          match.winner_entrant_id === match.entrant_a_id &&
          match.entrant_a_id !== null
        }
        muted={match.entrant_a_id === null}
        selectable={bothPresent && !saving}
        onPick={() => submit("a")}
      />
      <div className="border-t border-slate-100 dark:border-slate-800" />
      <BracketSlot
        name={
          match.entrant_b_id
            ? nameOf(match.entrant_b_id)
            : isBye
              ? t("games.matches.bye")
              : t("games.matches.tbd")
        }
        winner={
          match.winner_entrant_id === match.entrant_b_id &&
          match.entrant_b_id !== null
        }
        muted={match.entrant_b_id === null}
        selectable={bothPresent && !saving}
        onPick={() => submit("b")}
      />
      {bothPresent && !done && (
        <div className="border-t border-slate-100 px-3 py-1.5 text-center text-[11px] text-slate-400 dark:border-slate-800 dark:text-slate-500">
          {t("games.matches.winHint")}
        </div>
      )}
    </div>
  );
}

function BracketSlot({
  name,
  winner,
  muted,
  selectable,
  onPick,
}: {
  name: string;
  winner: boolean;
  muted: boolean;
  selectable: boolean;
  onPick: () => void;
}) {
  const base = `flex items-center justify-between gap-2 px-3 py-2 ${
    winner ? "bg-emerald-50 font-semibold dark:bg-emerald-900/20" : ""
  } ${muted ? "text-slate-400 dark:text-slate-500" : ""}`;
  const mark = winner ? (
    <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
  ) : null;
  if (!selectable) {
    return (
      <div className={base}>
        <span className="min-w-0 truncate">{name}</span>
        {mark}
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onPick}
      className={`w-full text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/50 ${base}`}
    >
      <span className="min-w-0 truncate">{name}</span>
      {winner ? (
        mark
      ) : (
        <Check className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" />
      )}
    </button>
  );
}

// ---------- shared match result entry ----------

function MatchRow({
  match,
  nameOf,
  groupId,
  tournamentId,
  onUpdated,
}: {
  match: TournamentMatch;
  nameOf: (id: string | null) => string;
  groupId: string;
  tournamentId: string;
  onUpdated: (next: TournamentDetail) => void;
}) {
  const { t } = useTranslation();
  const { submit, saving } = useSubmitResult(
    groupId,
    tournamentId,
    match.id,
    onUpdated,
  );
  const done = match.status === "done";
  const bothPresent =
    match.entrant_a_id !== null && match.entrant_b_id !== null;
  const aWins =
    done &&
    match.winner_entrant_id === match.entrant_a_id &&
    match.entrant_a_id !== null;
  const bWins =
    done &&
    match.winner_entrant_id === match.entrant_b_id &&
    match.entrant_b_id !== null;
  const draw = done && match.winner_entrant_id === null;

  return (
    <div className="card flex items-stretch gap-2 p-2">
      <WinnerButton
        label={nameOf(match.entrant_a_id)}
        selected={aWins}
        pending={bothPresent && !done}
        disabled={!bothPresent || saving}
        onClick={() => submit("a")}
      />
      <button
        type="button"
        onClick={() => submit("draw")}
        disabled={!bothPresent || saving}
        aria-label={t("games.matches.draw")}
        className={`flex shrink-0 items-center justify-center rounded-lg border px-2.5 text-[11px] font-medium transition disabled:opacity-40 ${
          draw
            ? "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
            : "border-slate-200 text-slate-400 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
        }`}
      >
        {t("games.matches.drawShort")}
      </button>
      <WinnerButton
        label={nameOf(match.entrant_b_id)}
        selected={bWins}
        pending={bothPresent && !done}
        disabled={!bothPresent || saving}
        onClick={() => submit("b")}
        align="right"
      />
    </div>
  );
}

function WinnerButton({
  label,
  selected,
  pending = false,
  disabled,
  onClick,
  align = "left",
}: {
  label: string;
  selected: boolean;
  pending?: boolean;
  disabled: boolean;
  onClick: () => void;
  align?: "left" | "right";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm transition disabled:opacity-50 ${
        align === "right" ? "flex-row-reverse text-right" : "text-left"
      } ${
        selected
          ? "border-emerald-400 bg-emerald-50 font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
          : pending
            ? "border-dashed border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/50 dark:border-slate-600 dark:hover:border-emerald-500 dark:hover:bg-emerald-900/10"
            : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
      }`}
    >
      <Check
        className={`h-4 w-4 shrink-0 ${
          selected
            ? "opacity-100"
            : pending
              ? "text-slate-300 dark:text-slate-600"
              : "opacity-0"
        }`}
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </button>
  );
}

function useSubmitResult(
  groupId: string,
  tournamentId: string,
  matchId: string,
  onUpdated: (next: TournamentDetail) => void,
) {
  const { t } = useTranslation();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const submit = useCallback(
    async (winner: "a" | "b" | "draw") => {
      setSaving(true);
      try {
        onUpdated(
          await gamesApi.submitResult(groupId, tournamentId, matchId, winner),
        );
        toast.success(t("games.matches.resultSaved"));
      } catch (e) {
        toast.error(e instanceof ApiError ? e.message : t("common.error"));
      } finally {
        setSaving(false);
      }
    },
    [groupId, tournamentId, matchId, onUpdated, t, toast],
  );
  return { submit, saving };
}

// ---------- helpers ----------

function useEntrantNames(detail: TournamentDetail) {
  const { t } = useTranslation();
  const map = useMemo(
    () => new Map(detail.entrants.map((e) => [e.id, e.display_name])),
    [detail.entrants],
  );
  return useCallback(
    (id: string | null) => (id ? map.get(id) ?? t("games.matches.tbd") : t("games.matches.tbd")),
    [map, t],
  );
}

function groupByRound(
  matches: TournamentMatch[],
): Array<[number, TournamentMatch[]]> {
  const byRound = new Map<number, TournamentMatch[]>();
  for (const m of matches) {
    const list = byRound.get(m.round) ?? [];
    list.push(m);
    byRound.set(m.round, list);
  }
  return [...byRound.entries()]
    .sort((x, y) => x[0] - y[0])
    .map(([round, list]) => [
      round,
      list.sort((p, q) => p.match_index - q.match_index),
    ]);
}
