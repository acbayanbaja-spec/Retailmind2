"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import {
  BusinessReportParams,
  getBusinessReport,
} from "@/services/report.service";

export function useBusinessReport(params: BusinessReportParams) {
  const { accessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["reports", "business", params],
    queryFn: () => getBusinessReport(accessToken!, params),
    enabled:
      isAuthenticated &&
      !!accessToken &&
      !!params.dateFrom &&
      !!params.dateTo,
  });
}
