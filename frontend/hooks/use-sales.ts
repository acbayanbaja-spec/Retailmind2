"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import {
  createSale,
  listSales,
  SaleListParams,
  searchPosProducts,
} from "@/services/sale.service";

export function usePosProducts(search: string) {
  const { accessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["pos", "products", search],
    queryFn: () => searchPosProducts(accessToken!, search || undefined),
    enabled: isAuthenticated && !!accessToken,
    staleTime: 15_000,
  });
}

export function useSalesList(params: SaleListParams) {
  const { accessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["sales", params],
    queryFn: () => listSales(accessToken!, params),
    enabled: isAuthenticated && !!accessToken,
  });
}

export function useCreateSale() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Parameters<typeof createSale>[1]) =>
      createSale(accessToken!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["pos"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
