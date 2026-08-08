"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { BusinessReportExpenseBreakdown } from "@/types";
import { Receipt } from "lucide-react";

interface ExpenseBreakdownChartProps {
  data: BusinessReportExpenseBreakdown[];
}

export function ExpenseBreakdownChart({ data }: ExpenseBreakdownChartProps) {
  const chartData = data.map((item) => ({
    name: item.categoryName,
    amount: item.totalAmount,
    count: item.expenseCount,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-warning" />
          Expenses by Category
        </CardTitle>
        <CardDescription>Spending breakdown for the selected period</CardDescription>
      </CardHeader>
      <div className="h-72">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No expense data for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#6b7280", fontSize: 11 }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={60}
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
                  `${props.payload?.count} expense(s)`,
                ]}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                }}
              />
              <Bar dataKey="amount" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
