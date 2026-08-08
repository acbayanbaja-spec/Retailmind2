import { apiClient, apiClientPaginated } from "@/lib/api-client";
import { CatalogOption, Product } from "@/types";

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  status?: string;
  lowStock?: boolean;
}

export async function listProducts(
  token: string,
  params: ProductListParams = {}
) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.categoryId) searchParams.set("categoryId", params.categoryId);
  if (params.status) searchParams.set("status", params.status);
  if (params.lowStock) searchParams.set("lowStock", "true");

  const query = searchParams.toString();
  return apiClientPaginated<Product>(
    `/api/products${query ? `?${query}` : ""}`,
    { token }
  );
}

export async function getProduct(token: string, id: string) {
  const response = await apiClient<Product>(`/api/products/${id}`, { token });
  return response.data!;
}

export async function createProduct(
  token: string,
  payload: Record<string, unknown>
) {
  const response = await apiClient<Product>("/api/products", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
  return response.data!;
}

export async function updateProduct(
  token: string,
  id: string,
  payload: Record<string, unknown>
) {
  const response = await apiClient<Product>(`/api/products/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
  return response.data!;
}

export async function archiveProduct(token: string, id: string) {
  await apiClient(`/api/products/${id}`, {
    method: "DELETE",
    token,
  });
}

export async function listCategories(token: string) {
  const response = await apiClient<CatalogOption[]>(
    "/api/products/meta/categories",
    { token }
  );
  return response.data ?? [];
}

export async function listBrands(token: string) {
  const response = await apiClient<CatalogOption[]>(
    "/api/products/meta/brands",
    { token }
  );
  return response.data ?? [];
}

export async function listSuppliers(token: string) {
  const response = await apiClient<CatalogOption[]>(
    "/api/products/meta/suppliers",
    { token }
  );
  return response.data ?? [];
}
