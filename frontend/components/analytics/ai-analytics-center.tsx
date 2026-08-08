"use client";

import {
  Brain,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { RevenueForecastChart } from "@/components/analytics/revenue-forecast-chart";
import { RecommendationsPanel } from "@/components/analytics/recommendations-panel";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAnalyticsMutations,
  useAnalyticsOverview,
} from "@/hooks/use-analytics";
import { formatDateTime, formatNumber } from "@/lib/format";

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-16 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export function AIAnalyticsCenter() {
  const { data, isLoading, isError, refetch } = useAnalyticsOverview();
  const { generate, markRead, dismiss } = useAnalyticsMutations();

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  if (isError) {
    return (
      <Card className="flex flex-col items-center gap-4 p-10 text-center">
        <p className="text-sm text-muted-foreground">
          Could not load analytics. Check that the API is running and try again.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="text-sm font-medium text-primary hover:underline"
        >
          Retry
        </button>
      </Card>
    );
  }

  const overview = data!;
  const revenueForecast = overview.revenueForecast;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">AI Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Statistical forecasting and rule-based business recommendations.
          </p>
          {overview.lastGeneratedAt ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Last generated {formatDateTime(overview.lastGeneratedAt)}
            </p>
          ) : null}
        </div>
        <Button
          onClick={() => generate.mutate()}
          disabled={generate.isPending}
        >
          {generate.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {generate.isPending ? "Generating…" : "Generate insights"}
        </Button>
      </div>

      {!overview.hasData ? (
        <Card className="flex flex-col items-center gap-4 p-12 text-center">
          <Brain className="h-12 w-12 text-muted-foreground/50" />
          <div>
            <p className="font-medium text-foreground">No insights yet</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Run insight generation to analyze sales trends, forecast demand,
              and get actionable recommendations for your store.
            </p>
          </div>
          <Button onClick={() => generate.mutate()} disabled={generate.isPending}>
            {generate.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Generate first insights
          </Button>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              title="7-Day Revenue Forecast"
              value={revenueForecast?.predictedValue ?? 0}
              icon={TrendingUp}
              accent="bg-primary/10 text-primary"
              format="currency"
            />
            <StatCard
              title="Forecast Confidence"
              value={revenueForecast?.confidence ?? 0}
              icon={Target}
              accent="bg-success/10 text-success"
            />
            <StatCard
              title="Unread Recommendations"
              value={overview.unreadRecommendations}
              icon={Sparkles}
              accent="bg-secondary/10 text-secondary"
            />
          </div>

          {revenueForecast?.explanation ? (
            <Card className="border-primary/20 bg-primary/5 p-4">
              <p className="text-sm text-foreground">{revenueForecast.explanation}</p>
            </Card>
          ) : null}

          <RevenueForecastChart
            historical={overview.revenueSeries.historical}
            projected={overview.revenueSeries.projected}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <h3 className="mb-4 font-semibold text-foreground">
                Demand forecasts (7-day)
              </h3>
              {overview.demandForecasts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No demand forecasts available.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="pb-3 pr-4 font-medium">Product</th>
                        <th className="pb-3 pr-4 font-medium">Units</th>
                        <th className="pb-3 font-medium">Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.demandForecasts.map((forecast) => (
                        <tr
                          key={forecast.id}
                          className="border-b border-border/60"
                        >
                          <td className="py-3 pr-4">
                            <p className="font-medium text-foreground">
                              {forecast.productName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {forecast.productSku}
                            </p>
                          </td>
                          <td className="py-3 pr-4 font-medium">
                            {formatNumber(forecast.predictedValue)}
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {forecast.confidence !== null
                              ? `${forecast.confidence}%`
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card>
              <h3 className="mb-4 font-semibold text-foreground">
                Top demand detail
              </h3>
              <ul className="space-y-3">
                {overview.demandForecasts.slice(0, 5).map((forecast) => (
                  <li
                    key={forecast.id}
                    className="rounded-xl bg-muted/50 px-3 py-2.5 text-sm"
                  >
                    <p className="font-medium text-foreground">
                      {forecast.productName}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {forecast.explanation}
                    </p>
                    <p className="mt-1 text-xs font-medium text-primary">
                      {formatNumber(forecast.predictedValue)} units projected
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <RecommendationsPanel
            recommendations={overview.recommendations}
            onMarkRead={(id) => markRead.mutate(id)}
            onDismiss={(id) => dismiss.mutate(id)}
            isUpdating={markRead.isPending || dismiss.isPending}
          />
        </>
      )}
    </div>
  );
}
