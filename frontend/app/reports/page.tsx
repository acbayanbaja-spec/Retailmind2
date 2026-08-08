import { ReportCenter } from "@/components/reports/report-center";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function ReportsPage() {
  return (
    <DashboardLayout
      title="Reports"
      description="Generate sales, inventory, and financial reports."
    >
      <ReportCenter />
    </DashboardLayout>
  );
}
