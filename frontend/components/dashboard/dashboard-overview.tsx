"use client";

import { LowStockList } from "@/components/dashboard/low-stock-list";
import { PaymentBreakdownChart } from "@/components/dashboard/payment-breakdown-chart";
import { RecentActivityList } from "@/components/dashboard/recent-activity-list";
import { SalesTrendChart } from "@/components/dashboard/sales-trend-chart";
import { StatCard } from "@/components/dashboard/stat-card";
import { TopProductsList } from "@/components/dashboard/top-products-list";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardOverview } from "@/hooks/use-dashboard";
import { formatCurrency } from "@/lib/format";
import {
  AlertTriangle,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-40 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}

export function DashboardOverview() {
  const { data, isLoading, isError, refetch } = useDashboardOverview();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError || !data) {
    return (
      <Card className="flex flex-col items-center gap-4 p-10 text-center">
        <p className="text-sm text-muted-foreground">
          Could not load dashboard data. Check that the API is running and try again.
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

  const { summary } = data;

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary to-secondary p-8 text-white shadow-lg">
        <div className="relative z-10 grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <p className="text-sm font-medium text-white/80">Business overview</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Your command center
            </h2>
            <p className="mt-3 text-sm text-white/80">
              Live metrics from sales, inventory, and activity across RetailMind.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1">
            <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs text-white/70">Month revenue</p>
              <p className="mt-1 text-xl font-bold">
                {formatCurrency(summary.monthRevenue)}
              </p>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs text-white/70">Month expenses</p>
              <p className="mt-1 text-xl font-bold">
                {formatCurrency(summary.monthExpenses)}
              </p>
            </div>
          </div>
        </div>
        <div className="absolute -right-8 -top-8 h-48 w-48 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 right-24 h-32 w-32 rounded-full bg-white/5" />
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Today's Revenue"
          value={summary.todayRevenue}
          change={summary.todayRevenueChange}
          icon={TrendingUp}
          accent="bg-primary/10 text-primary"
          format="currency"
        />
        <StatCard
          title="Today's Sales"
          value={summary.todaySalesCount}
          change={summary.todaySalesChange}
          icon={ShoppingBag}
          accent="bg-success/10 text-success"
        />
        <StatCard
          title="Active Products"
          value={summary.totalProducts}
          icon={Package}
          accent="bg-secondary/10 text-secondary"
        />
        <StatCard
          title="Active Customers"
          value={summary.activeCustomers}
          icon={Users}
          accent="bg-warning/10 text-warning"
        />
      </div>

      {summary.lowStockCount > 0 ? (
        <Card className="flex items-center gap-3 border-warning/30 bg-warning/5 px-4 py-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
          <p className="text-sm text-foreground">
            <span className="font-semibold">{summary.lowStockCount}</span> product
            {summary.lowStockCount === 1 ? "" : "s"} at or below minimum stock.
          </p>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <SalesTrendChart data={data.salesTrend} />
        <PaymentBreakdownChart data={data.paymentBreakdown} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TopProductsList products={data.topProducts} />
        <LowStockList
          products={data.lowStockProducts}
          totalCount={summary.lowStockCount}
        />
      </div>

      <RecentActivityList activity={data.recentActivity} />
    </div>
  );
}
