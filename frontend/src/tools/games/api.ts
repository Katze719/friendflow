import { api } from "../../api/client";
import type {
  TournamentDetail,
  TournamentFormat,
  TournamentSummary,
} from "../../api/types";

export interface CreateTournamentPayload {
  name: string;
  format: TournamentFormat;
  team_mode: boolean;
  /** People per team; only used when `team_mode` is true. */
  team_size?: number | null;
}

export interface AddParticipantPayload {
  /** Guest entry (name only). */
  display_name?: string;
  /** Single member. */
  user_id?: string;
  /** Bulk add (the "add all members" button). */
  user_ids?: string[];
}

const base = (groupId: string) => `/api/groups/${groupId}/games`;

export const gamesApi = {
  list: (groupId: string) =>
    api<TournamentSummary[]>(`${base(groupId)}/tournaments`),

  create: (groupId: string, body: CreateTournamentPayload) =>
    api<TournamentDetail>(`${base(groupId)}/tournaments`, {
      method: "POST",
      body,
    }),

  get: (groupId: string, tid: string) =>
    api<TournamentDetail>(`${base(groupId)}/tournaments/${tid}`),

  /** Toggle team mode / team size while still in setup. */
  update: (
    groupId: string,
    tid: string,
    body: { team_mode: boolean; team_size?: number | null },
  ) =>
    api<TournamentDetail>(`${base(groupId)}/tournaments/${tid}`, {
      method: "PUT",
      body,
    }),

  remove: (groupId: string, tid: string) =>
    api<{ ok: true }>(`${base(groupId)}/tournaments/${tid}`, {
      method: "DELETE",
    }),

  addParticipant: (groupId: string, tid: string, body: AddParticipantPayload) =>
    api<TournamentDetail>(`${base(groupId)}/tournaments/${tid}/participants`, {
      method: "POST",
      body,
    }),

  /** Pass `team_id: null` to move a participant back to the bench. */
  updateParticipant: (
    groupId: string,
    tid: string,
    pid: string,
    teamId: string | null,
  ) =>
    api<TournamentDetail>(
      `${base(groupId)}/tournaments/${tid}/participants/${pid}`,
      { method: "PUT", body: { team_id: teamId } },
    ),

  removeParticipant: (groupId: string, tid: string, pid: string) =>
    api<TournamentDetail>(
      `${base(groupId)}/tournaments/${tid}/participants/${pid}`,
      { method: "DELETE" },
    ),

  createTeam: (groupId: string, tid: string, name?: string) =>
    api<TournamentDetail>(`${base(groupId)}/tournaments/${tid}/teams`, {
      method: "POST",
      body: name ? { name } : {},
    }),

  updateTeam: (groupId: string, tid: string, teamId: string, name: string) =>
    api<TournamentDetail>(
      `${base(groupId)}/tournaments/${tid}/teams/${teamId}`,
      { method: "PUT", body: { name } },
    ),

  removeTeam: (groupId: string, tid: string, teamId: string) =>
    api<TournamentDetail>(
      `${base(groupId)}/tournaments/${tid}/teams/${teamId}`,
      { method: "DELETE" },
    ),

  randomize: (groupId: string, tid: string) =>
    api<TournamentDetail>(`${base(groupId)}/tournaments/${tid}/randomize`, {
      method: "POST",
    }),

  start: (groupId: string, tid: string) =>
    api<TournamentDetail>(`${base(groupId)}/tournaments/${tid}/start`, {
      method: "POST",
    }),

  submitResult: (
    groupId: string,
    tid: string,
    matchId: string,
    winner: "a" | "b" | "draw",
  ) =>
    api<TournamentDetail>(
      `${base(groupId)}/tournaments/${tid}/matches/${matchId}`,
      { method: "PUT", body: { winner } },
    ),
};
