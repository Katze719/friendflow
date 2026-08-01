import { api } from "../../api/client";
import type { Expense, GroupDetail, Payment, SplitwiseSummary, Trip } from "../../api/types";
import { currentOfflineUser, getCachedResponse, removePendingCreate, updatePendingCreate } from "../../offline/storage";

export interface ExpenseInput {
  description: string;
  amount_cents: number;
  paid_by: string;
  splits: { user_id: string; amount_cents: number }[];
  happened_at?: string;
  /** Optional trip to attribute this expense to. `null` (or omitted) means
   *  it's a general group expense that doesn't feed any trip budget. */
  trip_id?: string | null;
}

export interface PaymentInput {
  from_user: string;
  to_user: string;
  amount_cents: number;
  note?: string;
  happened_at?: string;
}

export const splitwiseApi = {
  summary: (groupId: string) =>
    api<SplitwiseSummary>(`/api/groups/${groupId}/splitwise/summary`),
  listExpenses: (groupId: string) =>
    api<Expense[]>(`/api/groups/${groupId}/splitwise/expenses`),
  getExpense: async (groupId: string, expenseId: string) => {
    try {
      return await api<Expense>(`/api/groups/${groupId}/splitwise/expenses/${expenseId}`);
    } catch (error) {
      const expenses = await getCachedResponse<Expense[]>(`/api/groups/${groupId}/splitwise/expenses`);
      const local = expenses?.find((expense) => expense.id === expenseId);
      if (local) return local;
      throw error;
    }
  },
  createExpense: async (groupId: string, payload: ExpenseInput) => {
    const [group, trips] = await Promise.all([
      getCachedResponse<GroupDetail>(`/api/groups/${groupId}`),
      getCachedResponse<Trip[]>(`/api/groups/${groupId}/trips`),
    ]);
    const people = group?.people ?? [];
    const payer = people.find((person) => person.id === payload.paid_by);
    const user = currentOfflineUser();
    const now = new Date().toISOString();
    return api<Expense>(`/api/groups/${groupId}/splitwise/expenses`, {
      method: "POST",
      body: payload,
      offlineCreate: {
        optimistic: {
          id: crypto.randomUUID(), group_id: groupId, paid_by: payload.paid_by,
          paid_by_display_name: payer?.display_name ?? "", description: payload.description.trim(),
          amount_cents: payload.amount_cents, happened_at: payload.happened_at ?? now,
          created_at: now, created_by: user?.id ?? "", trip_id: payload.trip_id ?? null,
          trip_name: trips?.find((trip) => trip.id === payload.trip_id)?.name ?? null,
          splits: payload.splits.map((split) => ({
            ...split,
            display_name: people.find((person) => person.id === split.user_id)?.display_name ?? "",
          })),
        },
        cachePath: `/api/groups/${groupId}/splitwise/expenses`,
      },
    });
  },
  updateExpense: async (groupId: string, expenseId: string, payload: ExpenseInput) => {
    const group = await getCachedResponse<GroupDetail>(`/api/groups/${groupId}`);
    const people = group?.people ?? [];
    const pending = await updatePendingCreate<Expense>(expenseId, payload, {
      description: payload.description.trim(),
      amount_cents: payload.amount_cents,
      paid_by: payload.paid_by,
      paid_by_display_name: people.find((person) => person.id === payload.paid_by)?.display_name ?? "",
      happened_at: payload.happened_at,
      trip_id: payload.trip_id ?? null,
      splits: payload.splits.map((split) => ({
        ...split,
        display_name: people.find((person) => person.id === split.user_id)?.display_name ?? "",
      })),
    });
    if (pending) return pending;
    return api<Expense>(`/api/groups/${groupId}/splitwise/expenses/${expenseId}`, {
      method: "PUT",
      body: payload,
    });
  },
  deleteExpense: async (groupId: string, expenseId: string) => {
    if (await removePendingCreate(expenseId)) return { ok: true };
    return api<{ ok: boolean }>(
      `/api/groups/${groupId}/splitwise/expenses/${expenseId}`,
      { method: "DELETE" },
    );
  },

  listPayments: (groupId: string) =>
    api<Payment[]>(`/api/groups/${groupId}/splitwise/payments`),
  createPayment: async (groupId: string, payload: PaymentInput) => {
    const group = await getCachedResponse<GroupDetail>(`/api/groups/${groupId}`);
    const people = group?.people ?? [];
    const now = new Date().toISOString();
    return api<Payment>(`/api/groups/${groupId}/splitwise/payments`, {
      method: "POST",
      body: payload,
      offlineCreate: {
        optimistic: {
          id: crypto.randomUUID(), group_id: groupId, from_user_id: payload.from_user,
          from_display_name: people.find((person) => person.id === payload.from_user)?.display_name ?? "",
          to_user_id: payload.to_user,
          to_display_name: people.find((person) => person.id === payload.to_user)?.display_name ?? "",
          amount_cents: payload.amount_cents, note: payload.note?.trim() || null,
          happened_at: payload.happened_at ?? now, created_at: now,
        },
        cachePath: `/api/groups/${groupId}/splitwise/payments`,
      },
    });
  },
  deletePayment: async (groupId: string, paymentId: string) => {
    if (await removePendingCreate(paymentId)) return { ok: true };
    return api<{ ok: boolean }>(
      `/api/groups/${groupId}/splitwise/payments/${paymentId}`,
      { method: "DELETE" },
    );
  },
};
