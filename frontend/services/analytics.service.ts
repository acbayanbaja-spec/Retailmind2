import { apiClient } from "@/lib/api-client";
import {
  AiRecommendation,
  AnalyticsOverview,
  ForecastRecord,
  ForecastType,
} from "@/types";

export async function getAnalyticsOverview(
  token: string
): Promise<AnalyticsOverview> {
  const response = await apiClient<AnalyticsOverview>(
    "/api/analytics/overview",
    { token }
  );
  return response.data!;
}

export async function listForecasts(
  token: string,
  params?: { type?: ForecastType; limit?: number }
): Promise<ForecastRecord[]> {
  const searchParams = new URLSearchParams();
  if (params?.type) searchParams.set("type", params.type);
  if (params?.limit) searchParams.set("limit", String(params.limit));

  const query = searchParams.toString();
  const response = await apiClient<ForecastRecord[]>(
    `/api/analytics/forecasts${query ? `?${query}` : ""}`,
    { token }
  );
  return response.data ?? [];
}

export async function listRecommendations(
  token: string,
  params?: { includeDismissed?: boolean; limit?: number }
): Promise<AiRecommendation[]> {
  const searchParams = new URLSearchParams();
  if (params?.includeDismissed) searchParams.set("includeDismissed", "true");
  if (params?.limit) searchParams.set("limit", String(params.limit));

  const query = searchParams.toString();
  const response = await apiClient<AiRecommendation[]>(
    `/api/analytics/recommendations${query ? `?${query}` : ""}`,
    { token }
  );
  return response.data ?? [];
}

export async function generateInsights(
  token: string
): Promise<AnalyticsOverview> {
  const response = await apiClient<AnalyticsOverview>(
    "/api/analytics/generate",
    { method: "POST", token }
  );
  return response.data!;
}

export async function updateRecommendation(
  token: string,
  id: string,
  input: { isRead?: boolean; isDismissed?: boolean }
): Promise<AiRecommendation> {
  const response = await apiClient<AiRecommendation>(
    `/api/analytics/recommendations/${id}`,
    { method: "PATCH", token, body: JSON.stringify(input) }
  );
  return response.data!;
}
