"use client";

import { motion } from "framer-motion";
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
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-44 w-full rounded-3xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-3xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-96 w-full rounded-3xl" />
        <Skeleton className="h-96 w-full rounded-3xl" />
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
          className="text-sm font-semibold text-primary hover:underline"
        >
          Retry
        </button>
      </Card>
    );
  }

  const { summary } = data;

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary via-primary-dark to-[#4a148c] p-0 text-white shadow-[var(--shadow-card)]">
          <div className="relative z-10 grid gap-6 p-8 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-accent-yellow" />
                Business Overview
              </div>
              <h2 className="text-3xl font-bold tracking-tight">
                Your Command Center
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/80">
                Live metrics from sales, inventory, and activity across RetailMind.
                Track performance and make data-driven decisions.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
              <div className="rounded-2xl bg-white/15 px-5 py-4 backdrop-blur-sm transition-transform hover:scale-[1.02]">
                <p className="text-xs font-medium text-white/70">Month revenue</p>
                <p className="mt-1 text-2xl font-bold">
                  {formatCurrency(summary.monthRevenue)}
                </p>
              </div>
              <div className="rounded-2xl bg-white/15 px-5 py-4 backdrop-blur-sm transition-transform hover:scale-[1.02]">
                <p className="text-xs font-medium text-white/70">Month expenses</p>
                <p className="mt-1 text-2xl font-bold">
                  {formatCurrency(summary.monthExpenses)}
                </p>
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-16 right-32 h-40 w-40 rounded-full bg-secondary/20 blur-xl" />
        </Card>
      </motion.div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Today's Revenue"
          value={summary.todayRevenue}
          change={summary.todayRevenueChange}
          icon={TrendingUp}
          accent="bg-primary/10 text-primary"
          format="currency"
          index={0}
        />
        <StatCard
          title="Today's Sales"
          value={summary.todaySalesCount}
          change={summary.todaySalesChange}
          icon={ShoppingBag}
          accent="bg-accent-lime/15 text-accent-lime"
          index={1}
        />
        <StatCard
          title="Active Products"
          value={summary.totalProducts}
          icon={Package}
          accent="bg-secondary/15 text-secondary"
          index={2}
        />
        <StatCard
          title="Active Customers"
          value={summary.activeCustomers}
          icon={Users}
          accent="bg-accent-yellow/15 text-warning"
          index={3}
        />
      </div>

      {summary.lowStockCount > 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="flex items-center gap-3 border-warning/30 bg-warning/5 px-5 py-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
            <p className="text-sm text-foreground">
              <span className="font-bold">{summary.lowStockCount}</span> product
              {summary.lowStockCount === 1 ? "" : "s"} at or below minimum stock.
            </p>
          </Card>
        </motion.div>
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
