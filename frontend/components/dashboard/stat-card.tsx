"use client";

import { motion } from "framer-motion";
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
  index?: number;
}

export function StatCard({
  title,
  value,
  change,
  changeLabel = "vs yesterday",
  icon: Icon,
  accent,
  format = "number",
  index = 0,
}: StatCardProps) {
  const displayValue =
    format === "currency" ? formatCurrency(value) : formatNumber(value);
  const hasChange = change !== undefined;
  const isPositive = (change ?? 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
    >
      <Card hover className="group">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {displayValue}
            </p>
            {hasChange ? (
              <p
                className={cn(
                  "mt-1.5 flex items-center gap-1 text-xs font-medium",
                  isPositive ? "text-success" : "text-danger"
                )}
              >
                {isPositive ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}
                {formatPercent(change)} {changeLabel}
              </p>
            ) : null}
          </div>
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110",
              accent
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
