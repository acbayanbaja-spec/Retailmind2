import {
  ForecastType,
  RecommendationType,
  SaleStatus,
} from "@prisma/client";
import prisma from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import {
  addDays,
  endOfDay,
  percentChange,
  startOfDay,
  toDateKey,
} from "../utils/date";
import {
  ListForecastsQuery,
  ListRecommendationsQuery,
  UpdateRecommendationInput,
} from "../validators/analytics.validator";

function decimalToNumber(value: { toNumber(): number } | number | null): number {
  if (value === null) return 0;
  return typeof value === "number" ? value : value.toNumber();
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function linearRegression(values: number[]): {
  slope: number;
  intercept: number;
  r2: number;
} {
  const n = values.length;
  if (n === 0) return { slope: 0, intercept: 0, r2: 0 };
  if (n === 1) return { slope: 0, intercept: values[0], r2: 0.5 };

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
    sumY2 += values[i] * values[i];
  }

  const denom = n * sumX2 - sumX * sumX;
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  const meanY = sumY / n;
  let ssTot = 0;
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const predicted = intercept + slope * i;
    ssTot += (values[i] - meanY) ** 2;
    ssRes += (values[i] - predicted) ** 2;
  }
  const r2 = ssTot === 0 ? 0.5 : Math.max(0, Math.min(1, 1 - ssRes / ssTot));

  return { slope, intercept, r2 };
}

function confidenceFromR2(r2: number, dataPoints: number): number {
  const sampleFactor = Math.min(1, dataPoints / 14);
  return round2(Math.max(40, Math.min(95, (0.5 + r2 * 0.45) * 100 * sampleFactor)));
}

async function getDailyRevenueSeries(days: number) {
  const now = new Date();
  const start = startOfDay(addDays(now, -(days - 1)));
  const end = endOfDay(now);

  const sales = await prisma.sale.findMany({
    where: {
      status: SaleStatus.COMPLETED,
      deletedAt: null,
      completedAt: { gte: start, lte: end },
    },
    select: { completedAt: true, totalAmount: true },
  });

  const map = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    map.set(toDateKey(addDays(start, i)), 0);
  }

  for (const sale of sales) {
    if (!sale.completedAt) continue;
    const key = toDateKey(sale.completedAt);
    if (map.has(key)) {
      map.set(key, (map.get(key) ?? 0) + decimalToNumber(sale.totalAmount));
    }
  }

  return Array.from(map.entries()).map(([date, revenue]) => ({ date, revenue }));
}

async function getProductSalesQty(
  productId: string,
  start: Date,
  end: Date
): Promise<number> {
  const result = await prisma.saleItem.aggregate({
    where: {
      productId,
      sale: {
        status: SaleStatus.COMPLETED,
        deletedAt: null,
        completedAt: { gte: start, lte: end },
      },
    },
    _sum: { quantity: true },
  });

  return result._sum.quantity ?? 0;
}

async function getProductSalesVelocity(productId: string, days: number) {
  const now = new Date();
  const start = startOfDay(addDays(now, -(days - 1)));
  const end = endOfDay(now);
  const totalQty = await getProductSalesQty(productId, start, end);
  return totalQty / days;
}

function mapForecast(row: {
  id: string;
  productId: string | null;
  type: ForecastType;
  predictedValue: { toNumber(): number } | number;
  confidence: { toNumber(): number } | number | null;
  dataPeriodStart: Date;
  dataPeriodEnd: Date;
  forecastDate: Date;
  explanation: string | null;
  createdAt: Date;
  product?: { id: string; name: string; sku: string } | null;
}) {
  return {
    id: row.id,
    productId: row.productId,
    productName: row.product?.name ?? null,
    productSku: row.product?.sku ?? null,
    type: row.type,
    predictedValue: decimalToNumber(row.predictedValue),
    confidence: row.confidence ? decimalToNumber(row.confidence) : null,
    dataPeriodStart: row.dataPeriodStart.toISOString().slice(0, 10),
    dataPeriodEnd: row.dataPeriodEnd.toISOString().slice(0, 10),
    forecastDate: row.forecastDate.toISOString().slice(0, 10),
    explanation: row.explanation,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapRecommendation(row: {
  id: string;
  productId: string | null;
  type: RecommendationType;
  title: string;
  description: string;
  recommendation: string;
  confidence: { toNumber(): number } | number | null;
  isRead: boolean;
  isDismissed: boolean;
  createdAt: Date;
  product?: { id: string; name: string; sku: string } | null;
}) {
  return {
    id: row.id,
    productId: row.productId,
    productName: row.product?.name ?? null,
    productSku: row.product?.sku ?? null,
    type: row.type,
    title: row.title,
    description: row.description,
    recommendation: row.recommendation,
    confidence: row.confidence ? decimalToNumber(row.confidence) : null,
    isRead: row.isRead,
    isDismissed: row.isDismissed,
    createdAt: row.createdAt.toISOString(),
  };
}

const productSelect = { select: { id: true, name: true, sku: true } } as const;

export const analyticsService = {
  async getOverview() {
    const [latestRevenueForecast, demandForecasts, recommendations, unreadCount] =
      await Promise.all([
        prisma.forecastHistory.findFirst({
          where: { type: ForecastType.REVENUE, productId: null },
          orderBy: { createdAt: "desc" },
        }),
        prisma.forecastHistory.findMany({
          where: { type: ForecastType.DEMAND, productId: { not: null } },
          include: { product: productSelect },
          orderBy: { predictedValue: "desc" },
          take: 5,
        }),
        prisma.aiRecommendation.findMany({
          where: { isDismissed: false },
          include: { product: productSelect },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
        prisma.aiRecommendation.count({
          where: { isDismissed: false, isRead: false },
        }),
      ]);

    const dailySeries = await getDailyRevenueSeries(30);
    const historical = dailySeries.map((d) => ({
      date: d.date,
      revenue: round2(d.revenue),
    }));

    let projected: { date: string; revenue: number }[] = [];
    if (historical.length >= 7) {
      const recent = historical.slice(-14).map((d) => d.revenue);
      const { slope, intercept } = linearRegression(recent);
      const lastDate = new Date(`${historical[historical.length - 1].date}T00:00:00`);
      for (let i = 1; i <= 7; i++) {
        const date = addDays(lastDate, i);
        const predicted = Math.max(0, intercept + slope * (recent.length - 1 + i));
        projected.push({ date: toDateKey(date), revenue: round2(predicted) });
      }
    }

    const lastGenerated = await prisma.forecastHistory.findFirst({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    return {
      hasData: !!latestRevenueForecast || recommendations.length > 0,
      lastGeneratedAt: lastGenerated?.createdAt.toISOString() ?? null,
      unreadRecommendations: unreadCount,
      revenueForecast: latestRevenueForecast
        ? mapForecast({ ...latestRevenueForecast, product: null })
        : null,
      demandForecasts: demandForecasts.map(mapForecast),
      recommendations: recommendations.map(mapRecommendation),
      revenueSeries: {
        historical,
        projected,
      },
    };
  },

  async listForecasts(query: ListForecastsQuery) {
    const rows = await prisma.forecastHistory.findMany({
      where: {
        ...(query.type ? { type: query.type } : {}),
      },
      include: { product: productSelect },
      orderBy: { createdAt: "desc" },
      take: query.limit ?? 20,
    });

    return rows.map(mapForecast);
  },

  async listRecommendations(query: ListRecommendationsQuery) {
    const rows = await prisma.aiRecommendation.findMany({
      where: {
        ...(query.includeDismissed ? {} : { isDismissed: false }),
      },
      include: { product: productSelect },
      orderBy: { createdAt: "desc" },
      take: query.limit ?? 30,
    });

    return rows.map(mapRecommendation);
  },

  async updateRecommendation(id: string, input: UpdateRecommendationInput) {
    const existing = await prisma.aiRecommendation.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Recommendation not found", 404);
    }

    const row = await prisma.aiRecommendation.update({
      where: { id },
      data: {
        ...(input.isRead !== undefined ? { isRead: input.isRead } : {}),
        ...(input.isDismissed !== undefined ? { isDismissed: input.isDismissed } : {}),
      },
      include: { product: productSelect },
    });

    return mapRecommendation(row);
  },

  async generateInsights() {
    const now = new Date();
    const dataStart = startOfDay(addDays(now, -59));
    const dataEnd = endOfDay(now);
    const forecastDate = startOfDay(addDays(now, 1));

    const dailySeries = await getDailyRevenueSeries(60);
    const revenueValues = dailySeries.map((d) => d.revenue);
    const recent14 = revenueValues.slice(-14);
    const { slope, intercept, r2 } = linearRegression(recent14);
    const avgDaily =
      recent14.length > 0
        ? recent14.reduce((a, b) => a + b, 0) / recent14.length
        : 0;

    const next7 = Math.max(0, (intercept + slope * (recent14.length + 3)) * 7);
    const next30 = Math.max(0, avgDaily * 30 * (1 + slope / Math.max(avgDaily, 1)));
    const revenueConfidence = confidenceFromR2(r2, recent14.length);

    await prisma.forecastHistory.create({
      data: {
        type: ForecastType.REVENUE,
        predictedValue: round2(next7),
        confidence: revenueConfidence,
        dataPeriodStart: dataStart,
        dataPeriodEnd: dataEnd,
        forecastDate,
        explanation: `7-day revenue forecast based on ${recent14.length}-day linear trend (R²=${round2(r2)}). Projected 30-day: ₱${round2(next30).toLocaleString()}.`,
      },
    });

    const products = await prisma.product.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        sku: true,
        currentStock: true,
        minStock: true,
      },
    });

    const demandEntries: {
      productId: string;
      name: string;
      predicted7Day: number;
      dailyVelocity: number;
      currentStock: number;
      minStock: number;
    }[] = [];

    for (const product of products) {
      const velocity = await getProductSalesVelocity(product.id, 30);
      if (velocity <= 0 && product.currentStock <= product.minStock) continue;
      demandEntries.push({
        productId: product.id,
        name: product.name,
        predicted7Day: round2(velocity * 7),
        dailyVelocity: round2(velocity),
        currentStock: product.currentStock,
        minStock: product.minStock,
      });
    }

    demandEntries.sort((a, b) => b.predicted7Day - a.predicted7Day);
    const topDemand = demandEntries.slice(0, 10);

    for (const entry of topDemand) {
      const daysOfStock =
        entry.dailyVelocity > 0 ? entry.currentStock / entry.dailyVelocity : 999;
      const confidence = round2(
        Math.min(90, 50 + Math.min(entry.dailyVelocity * 10, 40))
      );

      await prisma.forecastHistory.create({
        data: {
          productId: entry.productId,
          type: ForecastType.DEMAND,
          predictedValue: entry.predicted7Day,
          confidence,
          dataPeriodStart: startOfDay(addDays(now, -29)),
          dataPeriodEnd: dataEnd,
          forecastDate,
          explanation: `Estimated ${entry.predicted7Day} units over 7 days (${entry.dailyVelocity}/day avg). ${round2(daysOfStock)} days of stock remaining.`,
        },
      });
    }

    await prisma.aiRecommendation.deleteMany({ where: { isDismissed: false } });

    const recommendations: {
      productId?: string;
      type: RecommendationType;
      title: string;
      description: string;
      recommendation: string;
      confidence: number;
    }[] = [];

    const lowStock = products.filter((p) => p.currentStock <= p.minStock);
    for (const product of lowStock.slice(0, 5)) {
      recommendations.push({
        productId: product.id,
        type: RecommendationType.LOW_STOCK,
        title: `Low stock: ${product.name}`,
        description: `${product.name} (${product.sku}) has ${product.currentStock} units, at or below minimum (${product.minStock}).`,
        recommendation: `Reorder ${product.name} to restore buffer stock above ${product.minStock} units.`,
        confidence: 92,
      });
    }

    for (const entry of topDemand.slice(0, 3)) {
      recommendations.push({
        productId: entry.productId,
        type: RecommendationType.BEST_SELLER,
        title: `Best seller: ${entry.name}`,
        description: `${entry.name} sold ~${entry.dailyVelocity} units/day over the last 30 days.`,
        recommendation: `Keep ${entry.name} prominently stocked and consider promotional bundles.`,
        confidence: 85,
      });
    }

    for (const product of products) {
      const nowDay = endOfDay(new Date());
      const last7Start = startOfDay(addDays(nowDay, -6));
      const prev7Start = startOfDay(addDays(nowDay, -13));
      const prev7End = endOfDay(addDays(nowDay, -7));

      const qty7 = await getProductSalesQty(product.id, last7Start, nowDay);
      const qtyPrev7 = await getProductSalesQty(product.id, prev7Start, prev7End);
      const velocity7 = qty7 / 7;
      const velocityPrev7 = qtyPrev7 / 7;

      if (velocityPrev7 > 0.5 && velocity7 > velocityPrev7 * 1.5) {
        recommendations.push({
          productId: product.id,
          type: RecommendationType.HIGH_DEMAND,
          title: `Rising demand: ${product.name}`,
          description: `Sales velocity increased ${percentChange(velocity7, velocityPrev7)}% week-over-week.`,
          recommendation: `Increase stock levels for ${product.name} to avoid stockouts.`,
          confidence: 78,
        });
      }
      if (velocityPrev7 > 1 && velocity7 < velocityPrev7 * 0.5) {
        recommendations.push({
          productId: product.id,
          type: RecommendationType.DECLINING_SALES,
          title: `Declining sales: ${product.name}`,
          description: `Sales dropped ${Math.abs(percentChange(velocity7, velocityPrev7))}% compared to the prior week.`,
          recommendation: `Review pricing or run a promotion for ${product.name}.`,
          confidence: 72,
        });
      }
    }

    for (const product of products) {
      const velocity30 = await getProductSalesVelocity(product.id, 30);
      if (product.currentStock > 0 && velocity30 === 0) {
        recommendations.push({
          productId: product.id,
          type: RecommendationType.SLOW_MOVING,
          title: `Slow moving: ${product.name}`,
          description: `${product.name} has ${product.currentStock} units in stock with no sales in 30 days.`,
          recommendation: `Consider markdown, bundle deals, or reducing reorder quantity.`,
          confidence: 80,
        });
      }
    }

    for (const entry of topDemand) {
      const daysOfStock =
        entry.dailyVelocity > 0 ? entry.currentStock / entry.dailyVelocity : 999;
      if (daysOfStock < 7 && entry.dailyVelocity > 0) {
        recommendations.push({
          productId: entry.productId,
          type: RecommendationType.REORDER,
          title: `Reorder soon: ${entry.name}`,
          description: `At current velocity (${entry.dailyVelocity}/day), stock runs out in ~${round2(daysOfStock)} days.`,
          recommendation: `Place a purchase order for ${Math.ceil(entry.predicted7Day)} units of ${entry.name}.`,
          confidence: 88,
        });
      }
    }

    const monthStart = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
    const [monthSales, monthExpenses, prevMonthSales] = await Promise.all([
      prisma.sale.aggregate({
        where: {
          status: SaleStatus.COMPLETED,
          deletedAt: null,
          completedAt: { gte: monthStart, lte: dataEnd },
        },
        _sum: { totalAmount: true },
      }),
      prisma.expense.aggregate({
        where: {
          deletedAt: null,
          expenseDate: { gte: monthStart, lte: dataEnd },
        },
        _sum: { amount: true },
      }),
      prisma.sale.aggregate({
        where: {
          status: SaleStatus.COMPLETED,
          deletedAt: null,
          completedAt: {
            gte: startOfDay(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
            lte: endOfDay(new Date(now.getFullYear(), now.getMonth(), 0)),
          },
        },
        _sum: { totalAmount: true },
      }),
    ]);

    const monthRevenue = decimalToNumber(monthSales._sum.totalAmount);
    const prevRevenue = decimalToNumber(prevMonthSales._sum.totalAmount);
    const monthExpenseTotal = decimalToNumber(monthExpenses._sum.amount);
    const revenueChange = percentChange(monthRevenue, prevRevenue);

    recommendations.push({
      type: RecommendationType.INSIGHT,
      title: "Monthly revenue trend",
      description: `Month-to-date revenue is ${formatCurrencyPlain(monthRevenue)} (${revenueChange >= 0 ? "+" : ""}${revenueChange}% vs last month).`,
      recommendation:
        monthExpenseTotal > monthRevenue * 0.5
          ? "Expenses exceed 50% of revenue — review cost categories."
          : revenueChange >= 0
            ? "Revenue is trending up — maintain inventory for top sellers."
            : "Revenue is softening — focus on promotions and slow-moving stock.",
      confidence: 75,
    });

    const uniqueRecs = recommendations.slice(0, 20);

    await prisma.aiRecommendation.createMany({
      data: uniqueRecs.map((rec) => ({
        productId: rec.productId ?? null,
        type: rec.type,
        title: rec.title,
        description: rec.description,
        recommendation: rec.recommendation,
        confidence: rec.confidence,
        dataPeriodStart: dataStart,
        dataPeriodEnd: dataEnd,
        expiresAt: addDays(now, 7),
      })),
    });

    return this.getOverview();
  },
};

function formatCurrencyPlain(value: number): string {
  return `₱${value.toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
