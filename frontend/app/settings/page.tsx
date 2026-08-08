import { SettingsPanel } from "@/components/settings/settings-panel";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function SettingsPage() {
  return (
    <DashboardLayout
      title="Settings"
      description="Configure system settings and store preferences."
    >
      <SettingsPanel />
    </DashboardLayout>
  );
}
