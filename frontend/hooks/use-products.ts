"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import {
  archiveProduct,
  createProduct,
  listBrands,
  listCategories,
  listProducts,
  listSuppliers,
  ProductListParams,
  updateProduct,
} from "@/services/product.service";

export function useProductCatalog(params: ProductListParams) {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["products", params],
    queryFn: () => listProducts(accessToken || null, params),
    // Public endpoint - no authentication required
  });
}

export function useProductMeta() {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["products", "meta"],
    queryFn: async () => {
      const [categories, brands, suppliers] = await Promise.all([
        listCategories(accessToken || null),
        listBrands(accessToken || null),
        listSuppliers(accessToken || null),
      ]);
      return { categories, brands, suppliers };
    },
    // Public endpoints - no authentication required
    staleTime: 60_000,
  });
}

export function useProductMutations() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["inventory"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const create = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      createProduct(accessToken!, payload),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Record<string, unknown>;
    }) => updateProduct(accessToken!, id, payload),
    onSuccess: invalidate,
  });

  const archive = useMutation({
    mutationFn: (id: string) => archiveProduct(accessToken!, id),
    onSuccess: invalidate,
  });

  return { create, update, archive };
}
