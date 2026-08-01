import { api } from "./client";
import type { GroupDetail, GroupPerson, GroupSummary } from "./types";
import { currentOfflineUser, updatePendingCreate } from "../offline/storage";

export const groupsApi = {
  list: () => api<GroupSummary[]>("/api/groups"),
  create: (name: string, currency = "EUR") =>
    api<GroupSummary>("/api/groups", {
      method: "POST",
      body: { name, currency },
    }),
  join: (inviteCode: string) =>
    api<GroupSummary>("/api/groups/join", {
      method: "POST",
      body: { invite_code: inviteCode },
    }),
  get: (id: string) => api<GroupDetail>(`/api/groups/${id}`),
  delete: (id: string) =>
    api<{ ok: boolean }>(`/api/groups/${id}`, { method: "DELETE" }),
  leave: (id: string) =>
    api<{ ok: boolean; group_deleted: boolean }>(
      `/api/groups/${id}/leave`,
      { method: "POST" },
    ),
  removeMember: (id: string, memberId: string) =>
    api<{ ok: boolean }>(`/api/groups/${id}/members/${memberId}`, {
      method: "DELETE",
    }),
  createPerson: (id: string, displayName: string) => {
    const user = currentOfflineUser();
    const personId = crypto.randomUUID();
    return api<GroupPerson>(`/api/groups/${id}/people`, {
      method: "POST",
      body: { display_name: displayName },
      offlineCreate: {
        optimistic: {
          id: personId,
          user_id: null,
          display_name: displayName.trim(),
          kind: "guest",
          active: true,
          created_by: user?.id ?? "",
        },
        cachePath: `/api/groups/${id}`,
        cacheField: "people",
      },
    });
  },
  updatePerson: (
    id: string,
    personId: string,
    payload: { display_name: string; active: boolean },
  ) => updatePendingCreate<GroupPerson>(personId, payload).then((pending) => pending ??
    api<GroupPerson>(`/api/groups/${id}/people/${personId}`, {
      method: "PUT",
      body: payload,
    })),
  linkPerson: (id: string, personId: string, userId: string) =>
    api<{ ok: boolean; person_id: string }>(
      `/api/groups/${id}/people/${personId}/link`,
      { method: "POST", body: { user_id: userId } },
    ),
  openInvites: (id: string) =>
    api<{ invite_code: string }>(`/api/groups/${id}/invite/open`, {
      method: "POST",
    }),
  closeInvites: (id: string) =>
    api<{ ok: boolean }>(`/api/groups/${id}/invite/close`, {
      method: "POST",
    }),
};
