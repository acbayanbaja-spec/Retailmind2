"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardOverview } from "@/services/dashboard.service";
import { useAuth } from "@/providers/auth-provider";

export function useDashboardOverview() {
  const { accessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: () => getDashboardOverview(accessToken!),
    enabled: isAuthenticated && !!accessToken,
  });
}
