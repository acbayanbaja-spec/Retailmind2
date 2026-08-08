import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  accent: string;
  format?: "currency" | "number";
}

export function StatCard({
  title,
  value,
  change,
  changeLabel = "vs yesterday",
  icon: Icon,
  accent,
  format = "number",
}: StatCardProps) {
  const displayValue =
    format === "currency" ? formatCurrency(value) : formatNumber(value);
  const hasChange = change !== undefined;
  const isPositive = (change ?? 0) >= 0;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{displayValue}</p>
          {hasChange ? (
            <p
              className={cn(
                "mt-1 flex items-center gap-1 text-xs",
                isPositive ? "text-success" : "text-danger"
              )}
            >
              {isPositive ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {formatPercent(change)} {changeLabel}
            </p>
          ) : null}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            accent
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
