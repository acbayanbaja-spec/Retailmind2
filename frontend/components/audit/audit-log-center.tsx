"use client";

import { useMemo, useState } from "react";
import { Shield } from "lucide-react";
import { SelectField } from "@/components/shared/table-utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuditLogs } from "@/hooks/use-audit-logs";
import { formatDateTime } from "@/lib/format";
import { ActivityAction } from "@/types";

const ACTION_OPTIONS: { value: ActivityAction | ""; label: string }[] = [
  { value: "", label: "All actions" },
  { value: "LOGIN", label: "Login" },
  { value: "LOGOUT", label: "Logout" },
  { value: "CREATE", label: "Create" },
  { value: "UPDATE", label: "Update" },
  { value: "DELETE", label: "Delete" },
  { value: "SALE", label: "Sale" },
  { value: "REFUND", label: "Refund" },
  { value: "INVENTORY_ADJUSTMENT", label: "Inventory" },
  { value: "PURCHASE_ORDER", label: "Purchase order" },
  { value: "EXPENSE", label: "Expense" },
];

function AuditSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export function AuditLogCenter() {
  const defaults = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 6);
    return {
      dateFrom: start.toISOString().slice(0, 10),
      dateTo: end.toISOString().slice(0, 10),
    };
  }, []);

  const [dateFrom, setDateFrom] = useState(defaults.dateFrom);
  const [dateTo, setDateTo] = useState(defaults.dateTo);
  const [action, setAction] = useState<ActivityAction | "">("");
  const [page, setPage] = useState(1);
  const [applied, setApplied] = useState({
    dateFrom: defaults.dateFrom,
    dateTo: defaults.dateTo,
    action: "" as ActivityAction | "",
    page: 1,
  });

  const { data, isLoading, isError, refetch } = useAuditLogs({
    page: applied.page,
    limit: 25,
    dateFrom: applied.dateFrom,
    dateTo: applied.dateTo,
    action: applied.action || undefined,
  });

  if (isLoading) {
    return <AuditSkeleton />;
  }

  if (isError || !data) {
    return (
      <Card className="flex flex-col items-center gap-4 p-10 text-center">
        <p className="text-sm text-muted-foreground">
          Could not load audit logs. You may need administrator access.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="text-sm font-medium text-primary hover:underline"
        >
          Retry
        </button>
      </Card>
    );
  }

  function applyFilters() {
    setApplied({ dateFrom, dateTo, action, page: 1 });
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Shield className="h-5 w-5 text-primary" />
          Audit trail
        </h2>
        <p className="text-sm text-muted-foreground">
          Review sign-ins, data changes, and security-related events across the store.
        </p>
      </div>

      <Card className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Input
            label="From"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <Input
            label="To"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
          <SelectField
            label="Action"
            value={action}
            onChange={(e) => setAction(e.target.value as ActivityAction | "")}
          >
            {ACTION_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>
          <div className="flex items-end">
            <Button onClick={applyFilters} className="w-full">
              Apply filters
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">When</th>
                <th className="pb-3 pr-4 font-medium">User</th>
                <th className="pb-3 pr-4 font-medium">Action</th>
                <th className="pb-3 pr-4 font-medium">Description</th>
                <th className="pb-3 font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No audit entries for this filter.
                  </td>
                </tr>
              ) : (
                data.items.map((entry) => (
                  <tr key={entry.id} className="border-b border-border/60 align-top">
                    <td className="py-3 pr-4 whitespace-nowrap text-muted-foreground">
                      {formatDateTime(entry.createdAt)}
                    </td>
                    <td className="py-3 pr-4">
                      {entry.user ? (
                        <>
                          <p className="font-medium text-foreground">
                            {entry.user.firstName} {entry.user.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">{entry.user.email}</p>
                        </>
                      ) : (
                        <span className="text-muted-foreground">System</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                        {entry.action.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-foreground">{entry.description}</td>
                    <td className="py-3 text-xs text-muted-foreground">
                      {entry.ipAddress ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            Page {data.pagination.page} of {data.pagination.totalPages} ·{" "}
            {data.pagination.total} entries
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled={data.pagination.page <= 1}
              onClick={() => {
                const nextPage = Math.max(1, page - 1);
                setPage(nextPage);
                setApplied((prev) => ({ ...prev, page: nextPage }));
              }}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              disabled={data.pagination.page >= data.pagination.totalPages}
              onClick={() => {
                const nextPage = page + 1;
                setPage(nextPage);
                setApplied((prev) => ({ ...prev, page: nextPage }));
              }}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
