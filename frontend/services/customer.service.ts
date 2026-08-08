import { apiClient, apiClientPaginated } from "@/lib/api-client";
import { Customer, CustomerDetail } from "@/types";

export interface CustomerListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export async function listCustomers(token: string, params: CustomerListParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.isActive !== undefined) {
    searchParams.set("isActive", params.isActive ? "true" : "false");
  }

  const query = searchParams.toString();
  return apiClientPaginated<Customer>(
    `/api/customers${query ? `?${query}` : ""}`,
    { token }
  );
}

export async function getCustomer(token: string, id: string) {
  const response = await apiClient<CustomerDetail>(`/api/customers/${id}`, {
    token,
  });
  return response.data!;
}

export async function createCustomer(
  token: string,
  payload: Record<string, unknown>
) {
  const response = await apiClient<Customer>("/api/customers", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
  return response.data!;
}

export async function updateCustomer(
  token: string,
  id: string,
  payload: Record<string, unknown>
) {
  const response = await apiClient<Customer>(`/api/customers/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
  return response.data!;
}

export async function archiveCustomer(token: string, id: string) {
  await apiClient(`/api/customers/${id}`, {
    method: "DELETE",
    token,
  });
}
