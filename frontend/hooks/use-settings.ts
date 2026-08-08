"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import { bulkUpdateSettings, listSettings } from "@/services/setting.service";

export function useSettings() {
  const { accessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["settings"],
    queryFn: () => listSettings(accessToken!),
    enabled: isAuthenticated && !!accessToken,
  });
}

export function useSettingsMutations() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  const saveAll = useMutation({
    mutationFn: (settings: { key: string; value: string }[]) =>
      bulkUpdateSettings(accessToken!, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  return { saveAll };
}
