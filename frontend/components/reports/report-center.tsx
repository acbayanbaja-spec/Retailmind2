"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  DollarSign,
  Package,
  Receipt,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { ExpenseBreakdownChart } from "@/components/reports/expense-breakdown-chart";
import { LowStockList } from "@/components/dashboard/low-stock-list";
import { PaymentBreakdownChart } from "@/components/dashboard/payment-breakdown-chart";
import { SalesTrendChart } from "@/components/dashboard/sales-trend-chart";
import { StatCard } from "@/components/dashboard/stat-card";
import { TopProductsList } from "@/components/dashboard/top-products-list";
import { SelectField } from "@/components/shared/table-utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useBusinessReport } from "@/hooks/use-reports";
import { formatCurrency, formatNumber } from "@/lib/format";
import { ReportGroupBy } from "@/types";

type ReportTab = "overview" | "sales" | "expenses" | "inventory";

const TABS: { id: ReportTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "sales", label: "Sales" },
  { id: "expenses", label: "Expenses" },
  { id: "inventory", label: "Inventory" },
];

function defaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 29);
  return {
    dateFrom: start.toISOString().slice(0, 10),
    dateTo: end.toISOString().slice(0, 10),
  };
}

function ReportSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-16 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export function ReportCenter() {
  const defaults = useMemo(() => defaultDateRange(), []);
  const [activeTab, setActiveTab] = useState<ReportTab>("overview");
  const [dateFrom, setDateFrom] = useState(defaults.dateFrom);
  const [dateTo, setDateTo] = useState(defaults.dateTo);
  const [groupBy, setGroupBy] = useState<ReportGroupBy>("day");
  const [applied, setApplied] = useState({
    dateFrom: defaults.dateFrom,
    dateTo: defaults.dateTo,
    groupBy: "day" as ReportGroupBy,
  });

  const { data, isLoading, isError, refetch } = useBusinessReport(applied);

  function applyFilters() {
    setApplied({ dateFrom, dateTo, groupBy });
  }

  function setPreset(days: number) {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    const from = start.toISOString().slice(0, 10);
    const to = end.toISOString().slice(0, 10);
    setDateFrom(from);
    setDateTo(to);
    setApplied((prev) => ({ ...prev, dateFrom: from, dateTo: to }));
  }

  if (isLoading) {
    return <ReportSkeleton />;
  }

  if (isError || !data) {
    return (
      <Card className="flex flex-col items-center gap-4 p-10 text-center">
        <p className="text-sm text-muted-foreground">
          Could not load report data. Check that the API is running and try again.
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

  const { financial, inventory } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Business reports</h2>
          <p className="text-sm text-muted-foreground">
            Analyze sales, expenses, and inventory for any date range.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setPreset(7)}>
            Last 7 days
          </Button>
          <Button variant="secondary" onClick={() => setPreset(30)}>
            Last 30 days
          </Button>
          <Button variant="secondary" onClick={() => setPreset(90)}>
            Last 90 days
          </Button>
        </div>
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
            label="Group by"
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as ReportGroupBy)}
          >
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </SelectField>
          <div className="flex items-end">
            <Button onClick={applyFilters} className="w-full">
              Apply
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Showing {applied.dateFrom} to {applied.dateTo} · compared to the previous
          period of equal length
        </p>
      </Card>

      <div className="flex flex-wrap gap-2 border-b border-border pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Revenue"
              value={financial.revenue}
              change={financial.revenueChange}
              changeLabel="vs prev period"
              icon={TrendingUp}
              accent="bg-primary/10 text-primary"
              format="currency"
            />
            <StatCard
              title="Expenses"
              value={financial.expenses}
              change={financial.expensesChange}
              changeLabel="vs prev period"
              icon={Receipt}
              accent="bg-warning/10 text-warning"
              format="currency"
            />
            <StatCard
              title="Net Profit"
              value={financial.netProfit}
              change={financial.netProfitChange}
              changeLabel="vs prev period"
              icon={DollarSign}
              accent="bg-success/10 text-success"
              format="currency"
            />
            <StatCard
              title="Sales Count"
              value={financial.salesCount}
              change={financial.salesCountChange}
              changeLabel="vs prev period"
              icon={ShoppingBag}
              accent="bg-secondary/10 text-secondary"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Profit margin</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {financial.profitMargin}%
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Average order value</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {formatCurrency(financial.averageOrderValue)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Expenses recorded</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {formatNumber(financial.expenseCount)}
              </p>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <SalesTrendChart data={data.salesTrend} />
            <ExpenseBreakdownChart data={data.expenseBreakdown} />
          </div>
        </>
      ) : null}

      {activeTab === "sales" ? (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <SalesTrendChart data={data.salesTrend} />
            <PaymentBreakdownChart data={data.paymentBreakdown} />
          </div>
          <TopProductsList products={data.topProducts} />
        </>
      ) : null}

      {activeTab === "expenses" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Total expenses</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {formatCurrency(financial.expenses)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Expense entries</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {formatNumber(financial.expenseCount)}
              </p>
            </Card>
          </div>
          <ExpenseBreakdownChart data={data.expenseBreakdown} />
          <Card>
            <h3 className="mb-4 font-semibold text-foreground">Category detail</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Category</th>
                    <th className="pb-3 pr-4 font-medium">Entries</th>
                    <th className="pb-3 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.expenseBreakdown.map((row) => (
                    <tr key={row.categoryId} className="border-b border-border/60">
                      <td className="py-3 pr-4 font-medium text-foreground">
                        {row.categoryName}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {row.expenseCount}
                      </td>
                      <td className="py-3 font-medium">
                        {formatCurrency(row.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : null}

      {activeTab === "inventory" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Active SKUs"
              value={inventory.totalSkus}
              icon={Package}
              accent="bg-primary/10 text-primary"
            />
            <StatCard
              title="Total Units"
              value={inventory.totalUnits}
              icon={BarChart3}
              accent="bg-secondary/10 text-secondary"
            />
            <StatCard
              title="Retail Value"
              value={inventory.retailValue}
              icon={TrendingUp}
              accent="bg-success/10 text-success"
              format="currency"
            />
            <StatCard
              title="Cost Value"
              value={inventory.costValue}
              icon={DollarSign}
              accent="bg-warning/10 text-warning"
              format="currency"
            />
          </div>

          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Potential gross profit (on hand)</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {formatCurrency(inventory.potentialProfit)}
            </p>
          </Card>

          <LowStockList
            products={inventory.lowStockProducts}
            totalCount={inventory.lowStockCount}
          />

          <Card>
            <h3 className="mb-4 font-semibold text-foreground">Stock by category</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Category</th>
                    <th className="pb-3 pr-4 font-medium">SKUs</th>
                    <th className="pb-3 pr-4 font-medium">Units</th>
                    <th className="pb-3 font-medium">Retail value</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.byCategory.map((row) => (
                    <tr key={row.categoryName} className="border-b border-border/60">
                      <td className="py-3 pr-4 font-medium text-foreground">
                        {row.categoryName}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{row.skuCount}</td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {formatNumber(row.units)}
                      </td>
                      <td className="py-3 font-medium">
                        {formatCurrency(row.retailValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}
