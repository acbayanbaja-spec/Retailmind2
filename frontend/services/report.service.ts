import { apiClient } from "@/lib/api-client";
import { BusinessReport, ReportGroupBy } from "@/types";

export interface BusinessReportParams {
  dateFrom: string;
  dateTo: string;
  groupBy?: ReportGroupBy;
}

export async function getBusinessReport(
  token: string,
  params: BusinessReportParams
): Promise<BusinessReport> {
  const searchParams = new URLSearchParams({
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  });
  if (params.groupBy) {
    searchParams.set("groupBy", params.groupBy);
  }

  const response = await apiClient<BusinessReport>(
    `/api/reports/business?${searchParams.toString()}`,
    { token }
  );
  return response.data!;
}
