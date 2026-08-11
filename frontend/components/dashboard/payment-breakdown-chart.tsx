"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { DashboardPaymentBreakdown } from "@/types";
import { CreditCard } from "lucide-react";

const COLORS = ["#7b2cbf", "#c77dff", "#10b981"];

const METHOD_LABELS: Record<DashboardPaymentBreakdown["method"], string> = {
  CASH: "Cash",
  GCASH: "GCash",
  CARD: "Card",
};

interface PaymentBreakdownChartProps {
  data: DashboardPaymentBreakdown[];
}

export function PaymentBreakdownChart({ data }: PaymentBreakdownChartProps) {
  const chartData = data.map((item) => ({
    name: METHOD_LABELS[item.method],
    value: item.amount,
    count: item.count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-secondary" />
          Payment Methods
        </CardTitle>
        <CardDescription>Last 30 days by payment type</CardDescription>
      </CardHeader>
      <div className="h-72">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No payment data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={92}
                paddingAngle={3}
              >
                {chartData.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, _name, props) => [
                  formatCurrency(value),
                  `${props.payload?.name} (${props.payload?.count} txns)`,
                ]}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-3">
        {chartData.map((item, index) => (
          <div key={item.name} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            {item.name}
          </div>
        ))}
      </div>
    </Card>
  );
}
