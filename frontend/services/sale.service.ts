import { apiClient, apiClientPaginated } from "@/lib/api-client";
import { PosProduct, Sale } from "@/types";

export interface SaleListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export async function searchPosProducts(token: string, search?: string) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  params.set("limit", "30");

  const response = await apiClient<PosProduct[]>(
    `/api/sales/products?${params.toString()}`,
    { token }
  );
  return response.data ?? [];
}

export async function listSales(token: string, params: SaleListParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.status) searchParams.set("status", params.status);

  const query = searchParams.toString();
  return apiClientPaginated<Sale>(
    `/api/sales${query ? `?${query}` : ""}`,
    { token }
  );
}

export async function getSale(token: string, id: string) {
  const response = await apiClient<Sale>(`/api/sales/${id}`, { token });
  return response.data!;
}

export async function createSale(
  token: string,
  payload: {
    items: { productId: string; quantity: number }[];
    discountAmount?: number;
    notes?: string;
    payment: {
      method: "CASH" | "GCASH" | "CARD";
      amount: number;
      referenceNo?: string;
    };
  }
) {
  const response = await apiClient<Sale>("/api/sales", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
  return response.data!;
}
