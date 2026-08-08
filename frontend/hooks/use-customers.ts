"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import {
  archiveCustomer,
  createCustomer,
  CustomerListParams,
  listCustomers,
  updateCustomer,
} from "@/services/customer.service";

export function useCustomerList(params: CustomerListParams) {
  const { accessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["customers", params],
    queryFn: () => listCustomers(accessToken!, params),
    enabled: isAuthenticated && !!accessToken,
  });
}

export function useCustomerMutations() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["customers"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const create = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      createCustomer(accessToken!, payload),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Record<string, unknown>;
    }) => updateCustomer(accessToken!, id, payload),
    onSuccess: invalidate,
  });

  const archive = useMutation({
    mutationFn: (id: string) => archiveCustomer(accessToken!, id),
    onSuccess: invalidate,
  });

  return { create, update, archive };
}
