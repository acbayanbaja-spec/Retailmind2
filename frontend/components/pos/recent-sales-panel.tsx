"use client";

import { useMemo, useState } from "react";
import { Pagination, StatusBadge } from "@/components/shared/table-utils";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useSalesList } from "@/hooks/use-sales";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Search } from "lucide-react";

export function RecentSalesPanel() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const params = useMemo(
    () => ({
      page,
      limit: 15,
      search: search || undefined,
      status: "COMPLETED",
    }),
    [page, search]
  );

  const { data, isLoading, isError, refetch } = useSalesList(params);

  return (
    <Card className="space-y-4">
      <CardHeader>
        <CardTitle>Sales history</CardTitle>
        <CardDescription>Completed transactions processed through POS.</CardDescription>
      </CardHeader>

      <form
        className="flex max-w-md gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSearch(searchInput.trim());
        }}
      >
        <Input
          placeholder="Search sale # or customer..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <Button type="submit" variant="secondary">
          <Search className="h-4 w-4" />
        </Button>
      </form>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : isError || !data ? (
        <div className="py-10 text-center">
          <p className="text-sm text-muted-foreground">Could not load sales.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 text-sm font-medium text-primary hover:underline"
          >
            Retry
          </button>
        </div>
      ) : data.items.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No sales match your search.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Sale</th>
                  <th className="pb-3 pr-4 font-medium">Customer</th>
                  <th className="pb-3 pr-4 font-medium">Items</th>
                  <th className="pb-3 pr-4 font-medium">Payment</th>
                  <th className="pb-3 pr-4 font-medium">Total</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((sale) => (
                  <tr key={sale.id} className="border-b border-border/60">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-foreground">{sale.saleNumber}</p>
                      <p className="text-xs text-muted-foreground">{sale.cashierName}</p>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {sale.customer?.name ?? "Walk-in"}
                    </td>
                    <td className="py-3 pr-4">{sale.items.length}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={sale.payments[0]?.method ?? "CASH"} />
                    </td>
                    <td className="py-3 pr-4 font-medium">
                      {formatCurrency(sale.totalAmount)}
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {formatDateTime(sale.completedAt ?? sale.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination pagination={data.pagination} onPageChange={setPage} />
        </>
      )}
    </Card>
  );
}
