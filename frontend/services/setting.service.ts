import { apiClient } from "@/lib/api-client";
import { SystemSetting } from "@/types";

export async function listSettings(token: string) {
  const response = await apiClient<SystemSetting[]>("/api/settings", { token });
  return response.data ?? [];
}

export async function bulkUpdateSettings(
  token: string,
  settings: { key: string; value: string }[]
) {
  const response = await apiClient<SystemSetting[]>("/api/settings", {
    method: "PATCH",
    token,
    body: JSON.stringify({ settings }),
  });
  return response.data ?? [];
}
