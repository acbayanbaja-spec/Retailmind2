"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import {
  archiveExpense,
  archiveExpenseCategory,
  createExpense,
  createExpenseCategory,
  ExpenseListParams,
  getExpenseSummary,
  listExpenseCategories,
  listExpenses,
  updateExpense,
  updateExpenseCategory,
} from "@/services/expense.service";

export function useExpenseList(params: ExpenseListParams) {
  const { accessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["expenses", params],
    queryFn: () => listExpenses(accessToken!, params),
    enabled: isAuthenticated && !!accessToken,
  });
}

export function useExpenseSummary(month?: string) {
  const { accessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["expenses", "summary", month],
    queryFn: () => getExpenseSummary(accessToken!, month),
    enabled: isAuthenticated && !!accessToken,
  });
}

export function useExpenseCategories(isActive?: boolean) {
  const { accessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["expense-categories", isActive],
    queryFn: () => listExpenseCategories(accessToken!, isActive),
    enabled: isAuthenticated && !!accessToken,
  });
}

export function useExpenseMutations() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["expenses"] });
    queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const create = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      createExpense(accessToken!, payload),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Record<string, unknown>;
    }) => updateExpense(accessToken!, id, payload),
    onSuccess: invalidate,
  });

  const archive = useMutation({
    mutationFn: (id: string) => archiveExpense(accessToken!, id),
    onSuccess: invalidate,
  });

  const createCategory = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      createExpenseCategory(accessToken!, payload),
    onSuccess: invalidate,
  });

  const updateCategory = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Record<string, unknown>;
    }) => updateExpenseCategory(accessToken!, id, payload),
    onSuccess: invalidate,
  });

  const archiveCategory = useMutation({
    mutationFn: (id: string) => archiveExpenseCategory(accessToken!, id),
    onSuccess: invalidate,
  });

  return {
    create,
    update,
    archive,
    createCategory,
    updateCategory,
    archiveCategory,
  };
}
