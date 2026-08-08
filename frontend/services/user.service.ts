import { apiClient, apiClientPaginated } from "@/lib/api-client";
import { Employee, RoleOption } from "@/types";

export interface EmployeeListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  role?: Employee["role"];
}

export async function listEmployees(token: string, params: EmployeeListParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.isActive !== undefined) {
    searchParams.set("isActive", params.isActive ? "true" : "false");
  }
  if (params.role) searchParams.set("role", params.role);

  const query = searchParams.toString();
  return apiClientPaginated<Employee>(
    `/api/users${query ? `?${query}` : ""}`,
    { token }
  );
}

export async function listRoles(token: string) {
  const response = await apiClient<RoleOption[]>("/api/users/roles", { token });
  return response.data ?? [];
}

export async function createEmployee(
  token: string,
  payload: Record<string, unknown>
) {
  const response = await apiClient<Employee>("/api/users", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
  return response.data!;
}

export async function updateEmployee(
  token: string,
  id: string,
  payload: Record<string, unknown>
) {
  const response = await apiClient<Employee>(`/api/users/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
  return response.data!;
}

export async function archiveEmployee(token: string, id: string) {
  await apiClient(`/api/users/${id}`, {
    method: "DELETE",
    token,
  });
}
