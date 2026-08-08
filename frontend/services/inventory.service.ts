import { apiClient, apiClientPaginated } from "@/lib/api-client";
import {
  InventoryRow,
  InventorySummary,
  InventoryTransaction,
} from "@/types";

export interface InventoryListParams {
  page?: number;
  limit?: number;
  search?: string;
  lowStock?: boolean;
}

export async function listInventory(
  token: string,
  params: InventoryListParams = {}
) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.lowStock) searchParams.set("lowStock", "true");

  const query = searchParams.toString();
  return apiClientPaginated<InventoryRow>(
    `/api/inventory${query ? `?${query}` : ""}`,
    { token }
  );
}

export async function getInventorySummary(token: string) {
  const response = await apiClient<InventorySummary>("/api/inventory/summary", {
    token,
  });
  return response.data!;
}

export async function listInventoryTransactions(
  token: string,
  params: { page?: number; limit?: number; productId?: string } = {}
) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.productId) searchParams.set("productId", params.productId);

  const query = searchParams.toString();
  return apiClientPaginated<InventoryTransaction>(
    `/api/inventory/transactions${query ? `?${query}` : ""}`,
    { token }
  );
}

export async function adjustInventory(
  token: string,
  payload: {
    productId: string;
    type: "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT";
    quantity: number;
    notes?: string;
  }
) {
  const response = await apiClient("/api/inventory/adjust", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
  return response.data;
}
