import { api } from "../../api/client";
import type { Task, TaskPriority } from "../../api/types";
import { currentOfflineUser, removePendingCreate, updatePendingCreate } from "../../offline/storage";

function optimisticTask(body: CreateTaskPayload, groupId: string | null): Task {
  const user = currentOfflineUser();
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    group_id: groupId,
    owner_user_id: groupId ? null : user?.id ?? null,
    title: body.title.trim(),
    description: body.description?.trim() ?? "",
    priority: body.priority ?? "normal",
    due_date: body.due_date ?? null,
    is_done: false,
    done_at: null,
    done_by: null,
    done_by_display_name: null,
    assigned_to: body.assigned_to ?? null,
    assigned_to_display_name: null,
    created_by: user?.id ?? "",
    created_by_display_name: user?.display_name ?? "",
    created_at: now,
    updated_at: now,
  };
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  /** Null / undefined = unassigned. */
  assigned_to?: string | null;
  /** ISO date (YYYY-MM-DD) or null. */
  due_date?: string | null;
  priority?: TaskPriority;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  /** Pass `null` to clear the assignee, omit to keep as-is. */
  assigned_to?: string | null;
  /** Pass `null` to clear the due date, omit to keep as-is. */
  due_date?: string | null;
  priority?: TaskPriority;
}

export const tasksApi = {
  list: (groupId: string) => api<Task[]>(`/api/groups/${groupId}/tasks`),
  create: (groupId: string, body: CreateTaskPayload) =>
    api<Task>(`/api/groups/${groupId}/tasks`, {
      method: "POST",
      body,
      offlineCreate: {
        optimistic: optimisticTask(body, groupId),
        cachePath: `/api/groups/${groupId}/tasks`,
      },
    }),
  update: async (groupId: string, taskId: string, body: UpdateTaskPayload) => {
    const pending = await updatePendingCreate<Task>(taskId, body);
    if (pending) return pending;
    return api<Task>(`/api/groups/${groupId}/tasks/${taskId}`, {
      method: "PATCH",
      body,
    });
  },
  toggle: (groupId: string, taskId: string, done?: boolean) =>
    api<Task>(`/api/groups/${groupId}/tasks/${taskId}/toggle`, {
      method: "PUT",
      body: done === undefined ? {} : { done },
    }),
  remove: async (groupId: string, taskId: string) => {
    if (await removePendingCreate(taskId)) return { ok: true as const };
    return api<{ ok: true }>(`/api/groups/${groupId}/tasks/${taskId}`, {
      method: "DELETE",
    });
  },
  clearDone: (groupId: string) =>
    api<{ ok: true; removed: number }>(
      `/api/groups/${groupId}/tasks/clear-done`,
      { method: "POST" },
    ),
};

/** Personal tasks owned by the authenticated user. The backend rejects
 *  `assigned_to` in payloads here (the owner is implicit), so the UI
 *  must never try to set one. */
export const personalTasksApi = {
  list: () => api<Task[]>("/api/me/tasks"),
  create: (body: Omit<CreateTaskPayload, "assigned_to">) =>
    api<Task>("/api/me/tasks", {
      method: "POST",
      body,
      offlineCreate: { optimistic: optimisticTask(body, null), cachePath: "/api/me/tasks" },
    }),
  update: async (taskId: string, body: Omit<UpdateTaskPayload, "assigned_to">) => {
    const pending = await updatePendingCreate<Task>(taskId, body);
    if (pending) return pending;
    return api<Task>(`/api/me/tasks/${taskId}`, { method: "PATCH", body });
  },
  toggle: (taskId: string, done?: boolean) =>
    api<Task>(`/api/me/tasks/${taskId}/toggle`, {
      method: "PUT",
      body: done === undefined ? {} : { done },
    }),
  remove: async (taskId: string) => {
    if (await removePendingCreate(taskId)) return { ok: true as const };
    return api<{ ok: true }>(`/api/me/tasks/${taskId}`, { method: "DELETE" });
  },
  clearDone: () =>
    api<{ ok: true; removed: number }>("/api/me/tasks/clear-done", {
      method: "POST",
    }),
};
