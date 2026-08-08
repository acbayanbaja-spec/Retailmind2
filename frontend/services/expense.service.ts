import { apiClient, apiClientPaginated } from "@/lib/api-client";
import {
  Expense,
  ExpenseCategory,
  ExpenseRecurrence,
  ExpenseSummary,
} from "@/types";

export interface ExpenseListParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  recurrence?: ExpenseRecurrence;
  dateFrom?: string;
  dateTo?: string;
}

export async function listExpenses(token: string, params: ExpenseListParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.categoryId) searchParams.set("categoryId", params.categoryId);
  if (params.recurrence) searchParams.set("recurrence", params.recurrence);
  if (params.dateFrom) searchParams.set("dateFrom", params.dateFrom);
  if (params.dateTo) searchParams.set("dateTo", params.dateTo);

  const query = searchParams.toString();
  return apiClientPaginated<Expense>(
    `/api/expenses${query ? `?${query}` : ""}`,
    { token }
  );
}

export async function getExpenseSummary(token: string, month?: string) {
  const searchParams = new URLSearchParams();
  if (month) searchParams.set("month", month);

  const query = searchParams.toString();
  const response = await apiClient<ExpenseSummary>(
    `/api/expenses/summary${query ? `?${query}` : ""}`,
    { token }
  );
  return response.data!;
}

export async function createExpense(
  token: string,
  payload: Record<string, unknown>
) {
  const response = await apiClient<Expense>("/api/expenses", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
  return response.data!;
}

export async function updateExpense(
  token: string,
  id: string,
  payload: Record<string, unknown>
) {
  const response = await apiClient<Expense>(`/api/expenses/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
  return response.data!;
}

export async function archiveExpense(token: string, id: string) {
  await apiClient(`/api/expenses/${id}`, {
    method: "DELETE",
    token,
  });
}

export async function listExpenseCategories(
  token: string,
  isActive?: boolean
) {
  const searchParams = new URLSearchParams();
  if (isActive !== undefined) {
    searchParams.set("isActive", isActive ? "true" : "false");
  }

  const query = searchParams.toString();
  const response = await apiClient<ExpenseCategory[]>(
    `/api/expenses/categories${query ? `?${query}` : ""}`,
    { token }
  );
  return response.data ?? [];
}

export async function createExpenseCategory(
  token: string,
  payload: Record<string, unknown>
) {
  const response = await apiClient<ExpenseCategory>("/api/expenses/categories", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
  return response.data!;
}

export async function updateExpenseCategory(
  token: string,
  id: string,
  payload: Record<string, unknown>
) {
  const response = await apiClient<ExpenseCategory>(
    `/api/expenses/categories/${id}`,
    {
      method: "PATCH",
      token,
      body: JSON.stringify(payload),
    }
  );
  return response.data!;
}

export async function archiveExpenseCategory(token: string, id: string) {
  await apiClient(`/api/expenses/categories/${id}`, {
    method: "DELETE",
    token,
  });
}
