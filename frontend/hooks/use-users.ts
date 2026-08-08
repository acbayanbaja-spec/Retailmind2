"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import {
  archiveEmployee,
  createEmployee,
  EmployeeListParams,
  listEmployees,
  listRoles,
  updateEmployee,
} from "@/services/user.service";

export function useEmployeeList(params: EmployeeListParams) {
  const { accessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["employees", params],
    queryFn: () => listEmployees(accessToken!, params),
    enabled: isAuthenticated && !!accessToken,
  });
}

export function useRoles() {
  const { accessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["roles"],
    queryFn: () => listRoles(accessToken!),
    enabled: isAuthenticated && !!accessToken,
    staleTime: 60_000,
  });
}

export function useEmployeeMutations() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["employees"] });
  };

  const create = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      createEmployee(accessToken!, payload),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Record<string, unknown>;
    }) => updateEmployee(accessToken!, id, payload),
    onSuccess: invalidate,
  });

  const archive = useMutation({
    mutationFn: (id: string) => archiveEmployee(accessToken!, id),
    onSuccess: invalidate,
  });

  return { create, update, archive };
}
