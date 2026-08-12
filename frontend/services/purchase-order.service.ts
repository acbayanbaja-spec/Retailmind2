import { apiClient, apiClientPaginated } from "@/lib/api-client";
import { PoProductOption, PurchaseOrder, PurchaseOrderStatus } from "@/types";

export interface PurchaseOrderListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: PurchaseOrderStatus;
  supplierId?: string;
}

export interface PoProductsParams {
  supplierId: string;
  search?: string;
  limit?: number;
}

export async function listPurchaseOrders(
  token: string | null,
  params: PurchaseOrderListParams = {}
) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.status) searchParams.set("status", params.status);
  if (params.supplierId) searchParams.set("supplierId", params.supplierId);

  const query = searchParams.toString();
  return apiClientPaginated<PurchaseOrder>(
    `/api/purchase-orders${query ? `?${query}` : ""}`,
    { token: token || undefined }
  );
}

export async function getPurchaseOrder(token: string | null, id: string) {
  const response = await apiClient<PurchaseOrder>(`/api/purchase-orders/${id}`, {
    token: token || undefined,
  });
  return response.data!;
}

export async function listPoProducts(token: string | null, params: PoProductsParams) {
  const searchParams = new URLSearchParams();
  searchParams.set("supplierId", params.supplierId);
  if (params.search) searchParams.set("search", params.search);
  if (params.limit) searchParams.set("limit", String(params.limit));

  const response = await apiClient<PoProductOption[]>(
    `/api/purchase-orders/products?${searchParams.toString()}`,
    { token: token || undefined }
  );
  return response.data ?? [];
}

export async function createPurchaseOrder(
  token: string,
  payload: Record<string, unknown>
) {
  const response = await apiClient<PurchaseOrder>("/api/purchase-orders", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
  return response.data!;
}

export async function updatePurchaseOrder(
  token: string,
  id: string,
  payload: Record<string, unknown>
) {
  const response = await apiClient<PurchaseOrder>(`/api/purchase-orders/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
  return response.data!;
}

export async function submitPurchaseOrder(token: string, id: string) {
  const response = await apiClient<PurchaseOrder>(
    `/api/purchase-orders/${id}/submit`,
    { method: "POST", token }
  );
  return response.data!;
}

export async function approvePurchaseOrder(token: string, id: string) {
  const response = await apiClient<PurchaseOrder>(
    `/api/purchase-orders/${id}/approve`,
    { method: "POST", token }
  );
  return response.data!;
}

export async function markPurchaseOrderOrdered(token: string, id: string) {
  const response = await apiClient<PurchaseOrder>(
    `/api/purchase-orders/${id}/order`,
    { method: "POST", token }
  );
  return response.data!;
}

export async function receivePurchaseOrder(
  token: string,
  id: string,
  payload: Record<string, unknown>
) {
  const response = await apiClient<PurchaseOrder>(
    `/api/purchase-orders/${id}/receive`,
    {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    }
  );
  return response.data!;
}

export async function cancelPurchaseOrder(token: string, id: string) {
  const response = await apiClient<PurchaseOrder>(
    `/api/purchase-orders/${id}/cancel`,
    { method: "POST", token }
  );
  return response.data!;
}

export async function archivePurchaseOrder(token: string, id: string) {
  await apiClient(`/api/purchase-orders/${id}`, {
    method: "DELETE",
    token,
  });
}
