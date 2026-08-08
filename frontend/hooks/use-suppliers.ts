"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import {
  archiveSupplier,
  createSupplier,
  listSuppliers,
  SupplierListParams,
  updateSupplier,
} from "@/services/supplier.service";

export function useSupplierList(params: SupplierListParams) {
  const { accessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["suppliers", params],
    queryFn: () => listSuppliers(accessToken!, params),
    enabled: isAuthenticated && !!accessToken,
  });
}

export function useSupplierMutations() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const create = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      createSupplier(accessToken!, payload),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Record<string, unknown>;
    }) => updateSupplier(accessToken!, id, payload),
    onSuccess: invalidate,
  });

  const archive = useMutation({
    mutationFn: (id: string) => archiveSupplier(accessToken!, id),
    onSuccess: invalidate,
  });

  return { create, update, archive };
}
