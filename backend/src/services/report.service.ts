import { PaymentMethod, SaleStatus } from "@prisma/client";
import prisma from "../lib/prisma";
import {
  addDays,
  endOfDay,
  percentChange,
  startOfDay,
  toDateKey,
} from "../utils/date";
import { ReportQuery } from "../validators/report.validator";

function decimalToNumber(value: { toNumber(): number } | number | null): number {
  if (value === null) return 0;
  return typeof value === "number" ? value : value.toNumber();
}

function parseDateOnly(value: string): Date {
  return startOfDay(new Date(`${value}T00:00:00`));
}

function periodLengthDays(dateFrom: Date, dateTo: Date): number {
  const ms = endOfDay(dateTo).getTime() - startOfDay(dateFrom).getTime();
  return Math.max(1, Math.round(ms / (24 * 60 * 60 * 1000)) + 1);
}

function bucketKey(date: Date, groupBy: ReportQuery["groupBy"]): string {
  if (groupBy === "month") {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }
  if (groupBy === "week") {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return toDateKey(startOfDay(d));
  }
  return toDateKey(date);
}

function buildBucketKeys(
  start: Date,
  end: Date,
  groupBy: ReportQuery["groupBy"]
): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();

  if (groupBy === "month") {
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
    while (cursor <= endMonth) {
      const key = bucketKey(cursor, groupBy);
      if (!seen.has(key)) {
        seen.add(key);
        keys.push(key);
      }
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return keys;
  }

  if (groupBy === "week") {
    let cursor = startOfDay(start);
    const endDay = startOfDay(end);
    while (cursor <= endDay) {
      const key = bucketKey(cursor, groupBy);
      if (!seen.has(key)) {
        seen.add(key);
        keys.push(key);
      }
      cursor = addDays(cursor, 7);
    }
    return keys;
  }

  let cursor = startOfDay(start);
  const endDay = startOfDay(end);
  while (cursor <= endDay) {
    keys.push(toDateKey(cursor));
    cursor = addDays(cursor, 1);
  }
  return keys;
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

  const revenue = decimalToNumber(result._sum.totalAmount);
  const salesCount = result._count.id;

  return {
    revenue,
    salesCount,
    averageOrderValue: salesCount > 0 ? revenue / salesCount : 0,
  };
}

async function getExpenseTotal(start: Date, end: Date) {
  const result = await prisma.expense.aggregate({
    where: {
      deletedAt: null,
      expenseDate: { gte: start, lte: end },
    },
    _sum: { amount: true },
    _count: { id: true },
  });

  return {
    totalAmount: decimalToNumber(result._sum.amount),
    expenseCount: result._count.id,
  };
}

export const reportService = {
  async getBusinessReport(query: ReportQuery) {
    const periodStart = parseDateOnly(query.dateFrom);
    const periodEnd = endOfDay(parseDateOnly(query.dateTo));
    const days = periodLengthDays(periodStart, periodEnd);
    const previousEnd = endOfDay(addDays(periodStart, -1));
    const previousStart = startOfDay(addDays(previousEnd, -(days - 1)));

    const [
      currentSales,
      previousSales,
      currentExpenses,
      previousExpenses,
      trendSales,
      topProductGroups,
      paymentGroups,
      expenseByCategory,
      products,
      lowStockProducts,
    ] = await Promise.all([
      getSalesTotals(periodStart, periodEnd),
      getSalesTotals(previousStart, previousEnd),
      getExpenseTotal(periodStart, periodEnd),
      getExpenseTotal(previousStart, previousEnd),
      prisma.sale.findMany({
        where: {
          status: SaleStatus.COMPLETED,
          deletedAt: null,
          completedAt: { gte: periodStart, lte: periodEnd },
        },
        select: { completedAt: true, totalAmount: true },
      }),
      prisma.saleItem.groupBy({
        by: ["productId"],
        where: {
          sale: {
            status: SaleStatus.COMPLETED,
            deletedAt: null,
            completedAt: { gte: periodStart, lte: periodEnd },
          },
        },
        _sum: { quantity: true, totalPrice: true },
        orderBy: { _sum: { totalPrice: "desc" } },
        take: 10,
      }),
      prisma.payment.groupBy({
        by: ["method"],
        where: {
          status: "COMPLETED",
          sale: {
            status: SaleStatus.COMPLETED,
            deletedAt: null,
            completedAt: { gte: periodStart, lte: periodEnd },
          },
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.expense.groupBy({
        by: ["categoryId"],
        where: {
          deletedAt: null,
          expenseDate: { gte: periodStart, lte: periodEnd },
        },
        _sum: { amount: true },
        _count: { id: true },
        orderBy: { _sum: { amount: "desc" } },
      }),
      prisma.product.findMany({
        where: { deletedAt: null, status: "ACTIVE" },
        select: {
          id: true,
          name: true,
          sku: true,
          currentStock: true,
          minStock: true,
          costPrice: true,
          sellingPrice: true,
          category: { select: { name: true } },
        },
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
        take: 10,
      }),
    ]);

    const currentNetProfit = currentSales.revenue - currentExpenses.totalAmount;
    const previousNetProfit = previousSales.revenue - previousExpenses.totalAmount;
    const profitMargin =
      currentSales.revenue > 0
        ? Math.round((currentNetProfit / currentSales.revenue) * 1000) / 10
        : 0;

    const bucketKeys = buildBucketKeys(periodStart, periodEnd, query.groupBy);
    const trendMap = new Map(
      bucketKeys.map((key) => [key, { revenue: 0, salesCount: 0 }])
    );

    for (const sale of trendSales) {
      if (!sale.completedAt) continue;
      const key = bucketKey(sale.completedAt, query.groupBy);
      const entry = trendMap.get(key);
      if (!entry) continue;
      entry.revenue += decimalToNumber(sale.totalAmount);
      entry.salesCount += 1;
    }

    const productIds = topProductGroups.map((item) => item.productId);
    const topProductsMeta = productIds.length
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, sku: true },
        })
      : [];
    const productNameMap = new Map(topProductsMeta.map((p) => [p.id, p]));

    const categoryIds = expenseByCategory.map((row) => row.categoryId);
    const categories = categoryIds.length
      ? await prisma.expenseCategory.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true, name: true },
        })
      : [];
    const categoryNameMap = new Map(categories.map((c) => [c.id, c.name]));

    let totalUnits = 0;
    let retailValue = 0;
    let costValue = 0;
    const categoryInventory = new Map<
      string,
      { categoryName: string; skuCount: number; units: number; retailValue: number }
    >();

    for (const product of products) {
      const cost = decimalToNumber(product.costPrice);
      const price = decimalToNumber(product.sellingPrice);
      totalUnits += product.currentStock;
      retailValue += product.currentStock * price;
      costValue += product.currentStock * cost;

      const categoryName = product.category.name;
      const existing = categoryInventory.get(categoryName) ?? {
        categoryName,
        skuCount: 0,
        units: 0,
        retailValue: 0,
      };
      existing.skuCount += 1;
      existing.units += product.currentStock;
      existing.retailValue += product.currentStock * price;
      categoryInventory.set(categoryName, existing);
    }

    const lowStockCount = products.filter(
      (p) => p.currentStock <= p.minStock
    ).length;

    return {
      period: {
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        groupBy: query.groupBy,
      },
      financial: {
        revenue: currentSales.revenue,
        expenses: currentExpenses.totalAmount,
        netProfit: currentNetProfit,
        profitMargin,
        salesCount: currentSales.salesCount,
        expenseCount: currentExpenses.expenseCount,
        averageOrderValue: Math.round(currentSales.averageOrderValue * 100) / 100,
        revenueChange: percentChange(currentSales.revenue, previousSales.revenue),
        expensesChange: percentChange(
          currentExpenses.totalAmount,
          previousExpenses.totalAmount
        ),
        netProfitChange: percentChange(currentNetProfit, previousNetProfit),
        salesCountChange: percentChange(
          currentSales.salesCount,
          previousSales.salesCount
        ),
      },
      salesTrend: Array.from(trendMap.entries()).map(([date, values]) => ({
        date,
        revenue: Math.round(values.revenue * 100) / 100,
        salesCount: values.salesCount,
      })),
      paymentBreakdown: paymentGroups.map((item) => ({
        method: item.method as PaymentMethod,
        amount: decimalToNumber(item._sum.amount),
        count: item._count.id,
      })),
      topProducts: topProductGroups.map((item) => ({
        productId: item.productId,
        name: productNameMap.get(item.productId)?.name ?? "Unknown product",
        sku: productNameMap.get(item.productId)?.sku ?? "",
        quantitySold: item._sum.quantity ?? 0,
        revenue: decimalToNumber(item._sum.totalPrice),
      })),
      expenseBreakdown: expenseByCategory.map((row) => ({
        categoryId: row.categoryId,
        categoryName: categoryNameMap.get(row.categoryId) ?? "Unknown",
        totalAmount: decimalToNumber(row._sum.amount),
        expenseCount: row._count.id,
      })),
      inventory: {
        totalSkus: products.length,
        totalUnits,
        retailValue: Math.round(retailValue * 100) / 100,
        costValue: Math.round(costValue * 100) / 100,
        potentialProfit: Math.round((retailValue - costValue) * 100) / 100,
        lowStockCount,
        lowStockProducts,
        byCategory: Array.from(categoryInventory.values())
          .map((row) => ({
            ...row,
            retailValue: Math.round(row.retailValue * 100) / 100,
          }))
          .sort((a, b) => b.retailValue - a.retailValue),
      },
    };
  },
};
