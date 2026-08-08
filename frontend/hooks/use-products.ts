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
  const { accessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["products", params],
    queryFn: () => listProducts(accessToken!, params),
    enabled: isAuthenticated && !!accessToken,
  });
}

export function useProductMeta() {
  const { accessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["products", "meta"],
    queryFn: async () => {
      const [categories, brands, suppliers] = await Promise.all([
        listCategories(accessToken!),
        listBrands(accessToken!),
        listSuppliers(accessToken!),
      ]);
      return { categories, brands, suppliers };
    },
    enabled: isAuthenticated && !!accessToken,
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
