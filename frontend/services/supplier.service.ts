import { apiClient, apiClientPaginated } from "@/lib/api-client";
import { Supplier } from "@/types";

export interface SupplierListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export async function listSuppliers(token: string | null, params: SupplierListParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.isActive !== undefined) {
    searchParams.set("isActive", params.isActive ? "true" : "false");
  }

  const query = searchParams.toString();
  return apiClientPaginated<Supplier>(
    `/api/suppliers${query ? `?${query}` : ""}`,
    { token: token || undefined }
  );
}

export async function createSupplier(
  token: string,
  payload: Record<string, unknown>
) {
  const response = await apiClient<Supplier>("/api/suppliers", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
  return response.data!;
}

export async function updateSupplier(
  token: string,
  id: string,
  payload: Record<string, unknown>
) {
  const response = await apiClient<Supplier>(`/api/suppliers/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
  return response.data!;
}

export async function archiveSupplier(token: string, id: string) {
  await apiClient(`/api/suppliers/${id}`, {
    method: "DELETE",
    token,
  });
}
