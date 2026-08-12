"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import {
  adjustInventory,
  getInventorySummary,
  InventoryListParams,
  listInventory,
  listInventoryTransactions,
} from "@/services/inventory.service";

export function useInventoryList(params: InventoryListParams) {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["inventory", "list", params],
    queryFn: () => listInventory(accessToken || null, params),
    // Public endpoint - no authentication required
  });
}

export function useInventorySummary() {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["inventory", "summary"],
    queryFn: () => getInventorySummary(accessToken || null),
    // Public endpoint - no authentication required
  });
}

export function useInventoryTransactions(page = 1) {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["inventory", "transactions", page],
    queryFn: () =>
      listInventoryTransactions(accessToken || null, { page, limit: 10 }),
    // Public endpoint - no authentication required
  });
}

export function useAdjustInventory() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      productId: string;
      type: "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT";
      quantity: number;
      notes?: string;
    }) => adjustInventory(accessToken!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
