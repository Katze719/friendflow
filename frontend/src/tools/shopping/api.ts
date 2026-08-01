import { api } from "../../api/client";
import type { ShoppingItem, ShoppingList } from "../../api/types";
import { currentOfflineUser, getCachedResponse, removePendingCreate, updatePendingCreate } from "../../offline/storage";
import { getConnectionState } from "../../offline/networkState";

async function offlineEmpty<T>(promise: Promise<T[]>): Promise<T[]> {
  try {
    return await promise;
  } catch (error) {
    if (getConnectionState() === "offline") return [];
    throw error;
  }
}

function optimisticList(body: CreateListPayload, groupId: string | null): ShoppingList {
  const user = currentOfflineUser();
  return {
    id: crypto.randomUUID(),
    group_id: groupId,
    owner_user_id: groupId ? null : user?.id ?? null,
    name: body.name.trim(),
    items_open: 0,
    items_done: 0,
    created_by: user?.id ?? "",
    created_at: new Date().toISOString(),
  };
}

function optimisticItem(
  body: CreateItemPayload,
  listId: string,
  groupId: string | null,
): ShoppingItem {
  const user = currentOfflineUser();
  return {
    id: crypto.randomUUID(),
    group_id: groupId,
    owner_user_id: groupId ? null : user?.id ?? null,
    list_id: listId,
    name: body.name.trim(),
    quantity: body.quantity?.trim() ?? "",
    note: body.note?.trim() ?? "",
    is_done: false,
    done_at: null,
    done_by: null,
    done_by_display_name: null,
    added_by: user?.id ?? "",
    added_by_display_name: user?.display_name ?? "",
    created_at: new Date().toISOString(),
  };
}

export interface CreateItemPayload {
  name: string;
  quantity?: string;
  note?: string;
}

export interface UpdateItemPayload {
  name?: string;
  quantity?: string;
  note?: string;
}

export interface CreateListPayload {
  name: string;
}

export interface RenameListPayload {
  name: string;
}

/** List-level CRUD. A group can own any number of shopping lists; the UI
 *  lets users switch between them via a dropdown. */
export const shoppingListsApi = {
  list: (groupId: string) =>
    api<ShoppingList[]>(`/api/groups/${groupId}/shopping/lists`),
  create: (groupId: string, body: CreateListPayload) =>
    api<ShoppingList>(`/api/groups/${groupId}/shopping/lists`, {
      method: "POST",
      body,
      offlineCreate: {
        optimistic: optimisticList(body, groupId),
        cachePath: `/api/groups/${groupId}/shopping/lists`,
      },
    }),
  rename: async (groupId: string, listId: string, body: RenameListPayload) => {
    const pending = await updatePendingCreate<ShoppingList>(listId, body);
    if (pending) return pending;
    return api<ShoppingList>(`/api/groups/${groupId}/shopping/lists/${listId}`, {
      method: "PATCH",
      body,
    });
  },
  /** Returns the list the UI should switch to (the safeguard list if the
   *  caller deleted the last one; else any remaining list). */
  remove: async (groupId: string, listId: string) => {
    const path = `/api/groups/${groupId}/shopping/lists`;
    const cached = await getCachedResponse<ShoppingList[]>(path);
    const local = cached?.find((list) => list.id === listId);
    if (await removePendingCreate(listId)) return local ?? cached?.[0] as ShoppingList;
    return api<ShoppingList>(`/api/groups/${groupId}/shopping/lists/${listId}`, {
      method: "DELETE",
    });
  },
};

/** Item CRUD - all scoped to a specific list now. */
export const shoppingApi = {
  list: (groupId: string, listId: string) =>
    offlineEmpty(api<ShoppingItem[]>(
      `/api/groups/${groupId}/shopping/lists/${listId}/items`,
    )),
  create: (groupId: string, listId: string, body: CreateItemPayload) =>
    api<ShoppingItem>(
      `/api/groups/${groupId}/shopping/lists/${listId}/items`,
      {
        method: "POST",
        body,
        offlineCreate: {
          optimistic: optimisticItem(body, listId, groupId),
          cachePath: `/api/groups/${groupId}/shopping/lists/${listId}/items`,
        },
      },
    ),
  update: (
    groupId: string,
    listId: string,
    itemId: string,
    body: UpdateItemPayload,
  ) => updatePendingCreate<ShoppingItem>(itemId, body).then((pending) => pending ??
    api<ShoppingItem>(
      `/api/groups/${groupId}/shopping/lists/${listId}/items/${itemId}`,
      { method: "PATCH", body },
    )),
  toggle: (groupId: string, listId: string, itemId: string, done?: boolean) =>
    api<ShoppingItem>(
      `/api/groups/${groupId}/shopping/lists/${listId}/items/${itemId}/toggle`,
      {
        method: "PUT",
        body: done === undefined ? {} : { done },
      },
    ),
  remove: async (groupId: string, listId: string, itemId: string) => {
    if (await removePendingCreate(itemId)) return { ok: true as const };
    return api<{ ok: true }>(
      `/api/groups/${groupId}/shopping/lists/${listId}/items/${itemId}`,
      { method: "DELETE" },
    );
  },
  clearDone: (groupId: string, listId: string) =>
    api<{ ok: true; removed: number }>(
      `/api/groups/${groupId}/shopping/lists/${listId}/items/clear-done`,
      { method: "POST" },
    ),
};

// -------------------------------------------------------------------------
// Personal shopping (mirrors the group API, but under /api/me/shopping/...
// so every list/item is owned by the authenticated user and never shared).
// -------------------------------------------------------------------------

export const personalShoppingListsApi = {
  list: () => api<ShoppingList[]>("/api/me/shopping/lists"),
  create: (body: CreateListPayload) =>
    api<ShoppingList>("/api/me/shopping/lists", {
      method: "POST",
      body,
      offlineCreate: { optimistic: optimisticList(body, null), cachePath: "/api/me/shopping/lists" },
    }),
  rename: async (listId: string, body: RenameListPayload) => {
    const pending = await updatePendingCreate<ShoppingList>(listId, body);
    if (pending) return pending;
    return api<ShoppingList>(`/api/me/shopping/lists/${listId}`, {
      method: "PATCH",
      body,
    });
  },
  remove: async (listId: string) => {
    const cached = await getCachedResponse<ShoppingList[]>("/api/me/shopping/lists");
    const local = cached?.find((list) => list.id === listId);
    if (await removePendingCreate(listId)) return local ?? cached?.[0] as ShoppingList;
    return api<ShoppingList>(`/api/me/shopping/lists/${listId}`, {
      method: "DELETE",
    });
  },
};

export const personalShoppingApi = {
  list: (listId: string) =>
    offlineEmpty(api<ShoppingItem[]>(`/api/me/shopping/lists/${listId}/items`)),
  create: (listId: string, body: CreateItemPayload) =>
    api<ShoppingItem>(`/api/me/shopping/lists/${listId}/items`, {
      method: "POST",
      body,
      offlineCreate: {
        optimistic: optimisticItem(body, listId, null),
        cachePath: `/api/me/shopping/lists/${listId}/items`,
      },
    }),
  update: async (listId: string, itemId: string, body: UpdateItemPayload) => {
    const pending = await updatePendingCreate<ShoppingItem>(itemId, body);
    if (pending) return pending;
    return api<ShoppingItem>(`/api/me/shopping/lists/${listId}/items/${itemId}`, {
      method: "PATCH",
      body,
    });
  },
  toggle: (listId: string, itemId: string, done?: boolean) =>
    api<ShoppingItem>(
      `/api/me/shopping/lists/${listId}/items/${itemId}/toggle`,
      {
        method: "PUT",
        body: done === undefined ? {} : { done },
      },
    ),
  remove: async (listId: string, itemId: string) => {
    if (await removePendingCreate(itemId)) return { ok: true as const };
    return api<{ ok: true }>(`/api/me/shopping/lists/${listId}/items/${itemId}`, {
      method: "DELETE",
    });
  },
  clearDone: (listId: string) =>
    api<{ ok: true; removed: number }>(
      `/api/me/shopping/lists/${listId}/items/clear-done`,
      { method: "POST" },
    ),
};
