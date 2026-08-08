"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { AlertTriangle, Boxes, Package, Search } from "lucide-react";
import { AdjustStockDialog } from "@/components/inventory/adjust-stock-dialog";
import { Pagination, StatusBadge } from "@/components/shared/table-utils";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SelectField } from "@/components/shared/table-utils";
import {
  useAdjustInventory,
  useInventoryList,
  useInventorySummary,
  useInventoryTransactions,
} from "@/hooks/use-inventory";
import { formatDateTime, formatNumber } from "@/lib/format";
import { AdjustStockFormValues } from "@/schemas/product.schema";
import { InventoryRow } from "@/types";
import { ApiError } from "@/lib/api-client";

function SummaryCard({
  title,
  value,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
        </div>
        <div className={`rounded-xl p-3 ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

export function InventoryManager() {
  const [page, setPage] = useState(1);
  const [txPage, setTxPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<InventoryRow | null>(null);

  const params = useMemo(
    () => ({
      page,
      limit: 15,
      search: search || undefined,
      lowStock: lowStockOnly || undefined,
    }),
    [page, search, lowStockOnly]
  );

  const { data: summary, isLoading: summaryLoading } = useInventorySummary();
  const { data, isLoading, isError, refetch } = useInventoryList(params);
  const { data: transactions } = useInventoryTransactions(txPage);
  const adjust = useAdjustInventory();

  async function handleAdjust(values: AdjustStockFormValues) {
    try {
      await adjust.mutateAsync({
        productId: values.productId,
        type: values.type,
        quantity: values.quantity,
        notes: values.notes,
      });
      toast.success("Inventory updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Adjustment failed");
      throw err;
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {summaryLoading || !summary ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))
        ) : (
          <>
            <SummaryCard
              title="Active SKUs"
              value={formatNumber(summary.totalSkus)}
              icon={Package}
              accent="bg-primary/10 text-primary"
            />
            <SummaryCard
              title="Total units on hand"
              value={formatNumber(summary.totalUnits)}
              icon={Boxes}
              accent="bg-secondary/10 text-secondary"
            />
            <SummaryCard
              title="Low stock alerts"
              value={formatNumber(summary.lowStockCount)}
              icon={AlertTriangle}
              accent="bg-warning/10 text-warning"
            />
          </>
        )}
      </div>

      <Card className="space-y-4">
        <CardHeader>
          <CardTitle>Stock levels</CardTitle>
          <CardDescription>
            Monitor quantities and apply manual stock movements.
          </CardDescription>
        </CardHeader>

        <div className="grid gap-3 md:grid-cols-3">
          <form
            className="flex gap-2 md:col-span-2"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setSearch(searchInput.trim());
            }}
          >
            <Input
              placeholder="Search product or SKU..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <Button type="submit" variant="secondary">
              <Search className="h-4 w-4" />
            </Button>
          </form>

          <SelectField
            value={lowStockOnly ? "true" : "false"}
            onChange={(e) => {
              setLowStockOnly(e.target.value === "true");
              setPage(1);
            }}
          >
            <option value="false">All items</option>
            <option value="true">Low stock only</option>
          </SelectField>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : isError || !data ? (
          <div className="py-10 text-center">
            <p className="text-sm text-muted-foreground">Could not load inventory.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 text-sm font-medium text-primary hover:underline"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Product</th>
                    <th className="pb-3 pr-4 font-medium">Category</th>
                    <th className="pb-3 pr-4 font-medium">On hand</th>
                    <th className="pb-3 pr-4 font-medium">Min / Max</th>
                    <th className="pb-3 pr-4 font-medium">Location</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((row) => (
                    <tr key={row.productId} className="border-b border-border/60">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-foreground">{row.name}</p>
                        <p className="text-xs text-muted-foreground">{row.sku}</p>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {row.categoryName}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              row.isLowStock
                                ? "font-semibold text-warning"
                                : "text-foreground"
                            }
                          >
                            {row.currentStock}
                          </span>
                          <StatusBadge status={row.status} isLowStock={row.isLowStock} />
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {row.minStock}
                        {row.maxStock ? ` / ${row.maxStock}` : ""}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{row.location}</td>
                      <td className="py-3">
                        <button
                          type="button"
                          onClick={() => setAdjustTarget(row)}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          Adjust
                        </button>
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

      <Card>
        <CardHeader>
          <CardTitle>Recent movements</CardTitle>
          <CardDescription>Latest stock in, out, and adjustment transactions.</CardDescription>
        </CardHeader>

        {!transactions ? (
          <Skeleton className="h-40 w-full" />
        ) : transactions.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No inventory transactions yet.</p>
        ) : (
          <>
            <ul className="space-y-3">
              {transactions.items.map((tx) => (
                <li
                  key={tx.id}
                  className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-border px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {tx.productName}{" "}
                      <span className="font-normal text-muted-foreground">
                        ({tx.productSku})
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tx.type.replace("_", " ")} · {tx.previousQty} → {tx.newQty}
                      {tx.performedByName ? ` · ${tx.performedByName}` : ""}
                    </p>
                    {tx.notes ? (
                      <p className="mt-1 text-xs text-muted-foreground">{tx.notes}</p>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(tx.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
            <Pagination
              pagination={transactions.pagination}
              onPageChange={setTxPage}
            />
          </>
        )}
      </Card>

      <AdjustStockDialog
        open={!!adjustTarget}
        onClose={() => setAdjustTarget(null)}
        product={adjustTarget}
        onSubmit={handleAdjust}
        isSubmitting={adjust.isPending}
      />
    </div>
  );
}
