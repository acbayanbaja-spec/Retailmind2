import { AIAnalyticsCenter } from "@/components/analytics/ai-analytics-center";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function AIAnalyticsPage() {
  return (
    <DashboardLayout
      title="AI Analytics"
      description="Sales forecasting, demand analysis, and business insights."
    >
      <AIAnalyticsCenter />
    </DashboardLayout>
  );
}
