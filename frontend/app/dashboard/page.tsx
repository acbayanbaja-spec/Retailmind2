import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { APP_DESCRIPTION } from "@/lib/constants/colors";

export default function DashboardPage() {
  return (
    <DashboardLayout title="Dashboard" description={APP_DESCRIPTION}>
      <DashboardOverview />
    </DashboardLayout>
  );
}
