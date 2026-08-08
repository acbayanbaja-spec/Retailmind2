"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import { ListAuditLogsParams, listAuditLogs } from "@/services/audit.service";

export function useAuditLogs(params: ListAuditLogsParams) {
  const { accessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["audit-logs", params],
    queryFn: () => listAuditLogs(accessToken!, params),
    enabled: isAuthenticated && !!accessToken,
  });
}
