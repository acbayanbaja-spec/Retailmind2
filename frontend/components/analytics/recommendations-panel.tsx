"use client";

import { cn } from "@/lib/utils";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { AiRecommendation, RecommendationType } from "@/types";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Brain,
  Check,
  Lightbulb,
  Package,
  ShoppingCart,
  X,
} from "lucide-react";

const TYPE_CONFIG: Record<
  RecommendationType,
  { icon: typeof Lightbulb; accent: string; label: string }
> = {
  RESTOCK: {
    icon: Package,
    accent: "bg-warning/10 text-warning",
    label: "Restock",
  },
  BEST_SELLER: {
    icon: ArrowUpRight,
    accent: "bg-success/10 text-success",
    label: "Best seller",
  },
  SLOW_MOVING: {
    icon: ArrowDownRight,
    accent: "bg-muted text-muted-foreground",
    label: "Slow moving",
  },
  LOW_STOCK: {
    icon: AlertTriangle,
    accent: "bg-danger/10 text-danger",
    label: "Low stock",
  },
  HIGH_DEMAND: {
    icon: ArrowUpRight,
    accent: "bg-primary/10 text-primary",
    label: "High demand",
  },
  DECLINING_SALES: {
    icon: ArrowDownRight,
    accent: "bg-warning/10 text-warning",
    label: "Declining",
  },
  REORDER: {
    icon: ShoppingCart,
    accent: "bg-secondary/10 text-secondary",
    label: "Reorder",
  },
  INSIGHT: {
    icon: Lightbulb,
    accent: "bg-primary/10 text-primary",
    label: "Insight",
  },
};

interface RecommendationsPanelProps {
  recommendations: AiRecommendation[];
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
  isUpdating?: boolean;
}

export function RecommendationsPanel({
  recommendations,
  onMarkRead,
  onDismiss,
  isUpdating,
}: RecommendationsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          AI Recommendations
        </CardTitle>
        <CardDescription>
          Rule-based insights from sales velocity, stock levels, and trends
        </CardDescription>
      </CardHeader>
      {recommendations.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No recommendations yet. Generate insights to analyze your store data.
        </p>
      ) : (
        <ul className="space-y-3">
          {recommendations.map((rec) => {
            const config = TYPE_CONFIG[rec.type];
            const Icon = config.icon;

            return (
              <li
                key={rec.id}
                className={cn(
                  "rounded-xl border border-border/60 p-4 transition-colors",
                  rec.isRead ? "bg-muted/30" : "bg-card"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      config.accent
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{rec.title}</p>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {config.label}
                      </span>
                      {rec.confidence !== null ? (
                        <span className="text-xs text-muted-foreground">
                          {rec.confidence}% confidence
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {rec.description}
                    </p>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {rec.recommendation}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatDateTime(rec.createdAt)}
                      {rec.productSku ? ` · ${rec.productSku}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {!rec.isRead ? (
                      <Button
                        variant="ghost"
                        onClick={() => onMarkRead(rec.id)}
                        disabled={isUpdating}
                        aria-label="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      onClick={() => onDismiss(rec.id)}
                      disabled={isUpdating}
                      aria-label="Dismiss"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
