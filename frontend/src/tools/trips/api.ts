import { api } from "../../api/client";
import type { TripFolder, TripLink } from "../../api/types";

export const tripsApi = {
  list: (groupId: string) =>
    api<TripLink[]>(`/api/groups/${groupId}/trips/links`),

  create: (
    groupId: string,
    payload: { url: string; note?: string; folder_id?: string | null },
  ) =>
    api<TripLink>(`/api/groups/${groupId}/trips/links`, {
      method: "POST",
      body: payload,
    }),

  update: (groupId: string, linkId: string, payload: { note?: string }) =>
    api<TripLink>(`/api/groups/${groupId}/trips/links/${linkId}`, {
      method: "PATCH",
      body: payload,
    }),

  remove: (groupId: string, linkId: string) =>
    api<{ ok: boolean }>(`/api/groups/${groupId}/trips/links/${linkId}`, {
      method: "DELETE",
    }),

  refresh: (groupId: string, linkId: string) =>
    api<TripLink>(`/api/groups/${groupId}/trips/links/${linkId}/refresh`, {
      method: "POST",
    }),

  vote: (groupId: string, linkId: string, value: 1 | -1 | 0) =>
    api<TripLink>(`/api/groups/${groupId}/trips/links/${linkId}/vote`, {
      method: "PUT",
      body: { value },
    }),

  moveLink: (groupId: string, linkId: string, folderId: string | null) =>
    api<TripLink>(`/api/groups/${groupId}/trips/links/${linkId}/folder`, {
      method: "PUT",
      body: { folder_id: folderId },
    }),

  listFolders: (groupId: string) =>
    api<TripFolder[]>(`/api/groups/${groupId}/trips/folders`),

  createFolder: (groupId: string, name: string) =>
    api<TripFolder>(`/api/groups/${groupId}/trips/folders`, {
      method: "POST",
      body: { name },
    }),

  updateFolder: (groupId: string, folderId: string, name: string) =>
    api<TripFolder>(`/api/groups/${groupId}/trips/folders/${folderId}`, {
      method: "PATCH",
      body: { name },
    }),

  deleteFolder: (groupId: string, folderId: string) =>
    api<{ ok: boolean }>(`/api/groups/${groupId}/trips/folders/${folderId}`, {
      method: "DELETE",
    }),
};
