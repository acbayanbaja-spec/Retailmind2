import { apiClient } from "@/lib/api-client";
import { ActivityAction, AuditLogListResponse } from "@/types";

export interface ListAuditLogsParams {
  page?: number;
  limit?: number;
  action?: ActivityAction;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function listAuditLogs(
  token: string,
  params: ListAuditLogsParams = {}
): Promise<AuditLogListResponse> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.action) searchParams.set("action", params.action);
  if (params.userId) searchParams.set("userId", params.userId);
  if (params.dateFrom) searchParams.set("dateFrom", params.dateFrom);
  if (params.dateTo) searchParams.set("dateTo", params.dateTo);

  const query = searchParams.toString();
  const response = await apiClient<AuditLogListResponse>(
    `/api/audit-logs${query ? `?${query}` : ""}`,
    { token }
  );
  return response.data!;
}
