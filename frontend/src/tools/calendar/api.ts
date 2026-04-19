import { api } from "../../api/client";
import type { CalendarCategory, CalendarEvent } from "../../api/types";

export interface CreateEventPayload {
  title: string;
  description?: string;
  location?: string;
  starts_at: string; // ISO-8601 UTC
  ends_at?: string | null;
  all_day?: boolean;
  category_id?: string | null;
}

export interface UpdateEventPayload {
  title?: string;
  description?: string;
  location?: string;
  starts_at?: string;
  /** `null` clears ends_at, `undefined` leaves untouched. */
  ends_at?: string | null;
  all_day?: boolean;
  /** `null` clears the category, `undefined` leaves untouched. */
  category_id?: string | null;
}

export interface CreateCategoryPayload {
  name: string;
  color: string;
}

export interface UpdateCategoryPayload {
  name?: string;
  color?: string;
}

/**
 * Abstraction over the two scopes the calendar endpoints come in: a
 * group calendar (shared with all group members) and the per-user
 * personal calendar. The only difference is the URL prefix, so the
 * client code speaks in terms of `CalendarScope` and we build the path
 * here.
 */
export type CalendarScope =
  | { kind: "group"; groupId: string }
  | { kind: "personal" };

function eventsBase(scope: CalendarScope): string {
  return scope.kind === "group"
    ? `/api/groups/${scope.groupId}/calendar/events`
    : `/api/me/calendar/events`;
}

function categoriesBase(scope: CalendarScope): string {
  return scope.kind === "group"
    ? `/api/groups/${scope.groupId}/calendar/categories`
    : `/api/me/calendar/categories`;
}

export const calendarApi = {
  listEvents: (scope: CalendarScope) => api<CalendarEvent[]>(eventsBase(scope)),
  createEvent: (scope: CalendarScope, body: CreateEventPayload) =>
    api<CalendarEvent>(eventsBase(scope), { method: "POST", body }),
  updateEvent: (scope: CalendarScope, eventId: string, body: UpdateEventPayload) =>
    api<CalendarEvent>(`${eventsBase(scope)}/${eventId}`, {
      method: "PATCH",
      body,
    }),
  removeEvent: (scope: CalendarScope, eventId: string) =>
    api<{ ok: true }>(`${eventsBase(scope)}/${eventId}`, { method: "DELETE" }),

  listCategories: (scope: CalendarScope) =>
    api<CalendarCategory[]>(categoriesBase(scope)),
  createCategory: (scope: CalendarScope, body: CreateCategoryPayload) =>
    api<CalendarCategory>(categoriesBase(scope), { method: "POST", body }),
  updateCategory: (
    scope: CalendarScope,
    categoryId: string,
    body: UpdateCategoryPayload,
  ) =>
    api<CalendarCategory>(`${categoriesBase(scope)}/${categoryId}`, {
      method: "PATCH",
      body,
    }),
  removeCategory: (scope: CalendarScope, categoryId: string) =>
    api<{ ok: true }>(`${categoriesBase(scope)}/${categoryId}`, {
      method: "DELETE",
    }),

  // Back-compat thin wrappers so existing callers keep working while
  // the rest of the UI migrates to the scope-aware names.
  list: (groupId: string) =>
    calendarApi.listEvents({ kind: "group", groupId }),
  create: (groupId: string, body: CreateEventPayload) =>
    calendarApi.createEvent({ kind: "group", groupId }, body),
  update: (groupId: string, eventId: string, body: UpdateEventPayload) =>
    calendarApi.updateEvent({ kind: "group", groupId }, eventId, body),
  remove: (groupId: string, eventId: string) =>
    calendarApi.removeEvent({ kind: "group", groupId }, eventId),
};

/** Fixed palette matching the backend's hex expectation. */
export const CATEGORY_PALETTE = [
  "#ef4444", // red-500
  "#f97316", // orange-500
  "#eab308", // yellow-500
  "#22c55e", // green-500
  "#14b8a6", // teal-500
  "#0ea5e9", // sky-500
  "#6366f1", // indigo-500
  "#a855f7", // purple-500
  "#ec4899", // pink-500
  "#64748b", // slate-500
] as const;
