"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import {
  generateInsights,
  getAnalyticsOverview,
  listForecasts,
  listRecommendations,
  updateRecommendation,
} from "@/services/analytics.service";
import { ForecastType } from "@/types";

export function useAnalyticsOverview() {
  const { accessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: () => getAnalyticsOverview(accessToken!),
    enabled: isAuthenticated && !!accessToken,
  });
}

export function useForecasts(type?: ForecastType) {
  const { accessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["analytics", "forecasts", type],
    queryFn: () => listForecasts(accessToken!, { type, limit: 20 }),
    enabled: isAuthenticated && !!accessToken,
  });
}

export function useRecommendations(includeDismissed = false) {
  const { accessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["analytics", "recommendations", includeDismissed],
    queryFn: () =>
      listRecommendations(accessToken!, { includeDismissed, limit: 30 }),
    enabled: isAuthenticated && !!accessToken,
  });
}

export function useAnalyticsMutations() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["analytics"] });
  };

  const generate = useMutation({
    mutationFn: () => generateInsights(accessToken!),
    onSuccess: invalidate,
  });

  const markRead = useMutation({
    mutationFn: (id: string) =>
      updateRecommendation(accessToken!, id, { isRead: true }),
    onSuccess: invalidate,
  });

  const dismiss = useMutation({
    mutationFn: (id: string) =>
      updateRecommendation(accessToken!, id, { isDismissed: true }),
    onSuccess: invalidate,
  });

  return { generate, markRead, dismiss };
}
