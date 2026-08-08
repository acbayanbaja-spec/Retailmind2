import { PaymentMethod, SaleStatus } from "@prisma/client";
import prisma from "../lib/prisma";
import {
  addDays,
  endOfDay,
  percentChange,
  startOfDay,
  toDateKey,
} from "../utils/date";

function decimalToNumber(value: { toNumber(): number } | number | null): number {
  if (value === null) return 0;
  return typeof value === "number" ? value : value.toNumber();
}

async function getSalesTotals(start: Date, end: Date) {
  const result = await prisma.sale.aggregate({
    where: {
      status: SaleStatus.COMPLETED,
      deletedAt: null,
      completedAt: { gte: start, lte: end },
    },
    _sum: { totalAmount: true },
    _count: { id: true },
  });

  return {
    revenue: decimalToNumber(result._sum.totalAmount),
    salesCount: result._count.id,
  };
}

export const dashboardService = {
  async getOverview() {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const yesterdayStart = startOfDay(addDays(now, -1));
    const yesterdayEnd = endOfDay(addDays(now, -1));
    const trendStart = startOfDay(addDays(now, -6));
    const monthStart = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
    const monthEnd = endOfDay(now);
    const analyticsStart = startOfDay(addDays(now, -29));

    const [
      today,
      yesterday,
      monthSales,
      monthExpenses,
      totalProducts,
      activeCustomers,
      lowStockCount,
      trendSales,
      topProductGroups,
      paymentGroups,
      lowStockProducts,
      recentActivity,
    ] = await Promise.all([
      getSalesTotals(todayStart, todayEnd),
      getSalesTotals(yesterdayStart, yesterdayEnd),
      getSalesTotals(monthStart, monthEnd),
      prisma.expense.aggregate({
        where: {
          deletedAt: null,
          expenseDate: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      }),
      prisma.product.count({
        where: { deletedAt: null, status: "ACTIVE" },
      }),
      prisma.customer.count({
        where: { deletedAt: null, isActive: true },
      }),
      prisma.product.count({
        where: {
          deletedAt: null,
          status: "ACTIVE",
          currentStock: { lte: prisma.product.fields.minStock },
        },
      }),
      prisma.sale.findMany({
        where: {
          status: SaleStatus.COMPLETED,
          deletedAt: null,
          completedAt: { gte: trendStart, lte: todayEnd },
        },
        select: { completedAt: true, totalAmount: true },
      }),
      prisma.saleItem.groupBy({
        by: ["productId"],
        where: {
          sale: {
            status: SaleStatus.COMPLETED,
            deletedAt: null,
            completedAt: { gte: analyticsStart, lte: todayEnd },
          },
        },
        _sum: { quantity: true, totalPrice: true },
        orderBy: { _sum: { totalPrice: "desc" } },
        take: 5,
      }),
      prisma.payment.groupBy({
        by: ["method"],
        where: {
          status: "COMPLETED",
          sale: {
            status: SaleStatus.COMPLETED,
            deletedAt: null,
            completedAt: { gte: analyticsStart, lte: todayEnd },
          },
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.product.findMany({
        where: {
          deletedAt: null,
          status: "ACTIVE",
          currentStock: { lte: prisma.product.fields.minStock },
        },
        select: {
          id: true,
          name: true,
          sku: true,
          currentStock: true,
          minStock: true,
        },
        orderBy: { currentStock: "asc" },
        take: 5,
      }),
      prisma.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          action: true,
          description: true,
          createdAt: true,
          user: {
            select: { firstName: true, lastName: true },
          },
        },
      }),
    ]);

    const trendMap = new Map<string, { revenue: number; salesCount: number }>();
    for (let i = 0; i < 7; i++) {
      const day = addDays(trendStart, i);
      trendMap.set(toDateKey(day), { revenue: 0, salesCount: 0 });
    }

    for (const sale of trendSales) {
      if (!sale.completedAt) continue;
      const key = toDateKey(sale.completedAt);
      const entry = trendMap.get(key);
      if (!entry) continue;
      entry.revenue += decimalToNumber(sale.totalAmount);
      entry.salesCount += 1;
    }

    const productIds = topProductGroups.map((item) => item.productId);
    const products = productIds.length
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true },
        })
      : [];
    const productNameMap = new Map(products.map((p) => [p.id, p.name]));

    return {
      summary: {
        todayRevenue: today.revenue,
        todaySalesCount: today.salesCount,
        todayRevenueChange: percentChange(today.revenue, yesterday.revenue),
        todaySalesChange: percentChange(today.salesCount, yesterday.salesCount),
        totalProducts,
        activeCustomers,
        lowStockCount,
        monthRevenue: monthSales.revenue,
        monthExpenses: decimalToNumber(monthExpenses._sum.amount),
      },
      salesTrend: Array.from(trendMap.entries()).map(([date, values]) => ({
        date,
        revenue: Math.round(values.revenue * 100) / 100,
        salesCount: values.salesCount,
      })),
      topProducts: topProductGroups.map((item) => ({
        productId: item.productId,
        name: productNameMap.get(item.productId) ?? "Unknown product",
        quantitySold: item._sum.quantity ?? 0,
        revenue: decimalToNumber(item._sum.totalPrice),
      })),
      paymentBreakdown: paymentGroups.map((item) => ({
        method: item.method as PaymentMethod,
        amount: decimalToNumber(item._sum.amount),
        count: item._count.id,
      })),
      lowStockProducts,
      recentActivity: recentActivity.map((log) => ({
        id: log.id,
        action: log.action,
        description: log.description,
        createdAt: log.createdAt.toISOString(),
        userName: log.user
          ? `${log.user.firstName} ${log.user.lastName}`
          : null,
      })),
    };
  },
};
