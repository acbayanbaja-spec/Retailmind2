import { apiClient } from "@/lib/api-client";
import { DashboardOverview } from "@/types";

export async function getDashboardOverview(
  token: string
): Promise<DashboardOverview> {
  const response = await apiClient<DashboardOverview>("/api/dashboard/overview", {
    token,
  });
  return response.data!;
}
