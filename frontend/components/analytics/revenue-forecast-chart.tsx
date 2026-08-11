"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatShortDate } from "@/lib/format";
import { TrendingUp } from "lucide-react";

interface RevenueForecastChartProps {
  historical: { date: string; revenue: number }[];
  projected: { date: string; revenue: number }[];
}

export function RevenueForecastChart({
  historical,
  projected,
}: RevenueForecastChartProps) {
  const historicalData = historical.map((point) => ({
    ...point,
    label: formatShortDate(point.date),
    kind: "actual" as const,
  }));

  const projectedData = projected.map((point) => ({
    ...point,
    label: formatShortDate(point.date),
    kind: "projected" as const,
  }));

  const chartData = [...historicalData, ...projectedData];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Revenue Trend & Forecast
        </CardTitle>
        <CardDescription>
          30-day history with 7-day linear projection
        </CardDescription>
      </CardHeader>
      <div className="h-72">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Not enough sales data to chart
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7b2cbf" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#7b2cbf" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="projectedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#6b7280", fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#6b7280", fontSize: 12 }}
                tickFormatter={(value) => `₱${Math.round(value / 1000)}k`}
              />
              <Tooltip
                formatter={(value: number, _name, props) => [
                  formatCurrency(value),
                  props.payload?.kind === "projected" ? "Projected" : "Actual",
                ]}
                labelFormatter={(label) => String(label)}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#7b2cbf"
                strokeWidth={2}
                fill="url(#actualGradient)"
                connectNulls
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
