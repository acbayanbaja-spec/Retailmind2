import { AuditLogCenter } from "@/components/audit/audit-log-center";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function AuditLogsPage() {
  return (
    <DashboardLayout
      title="Audit Logs"
      description="Security and activity audit trail for administrators."
    >
      <AuditLogCenter />
    </DashboardLayout>
  );
}
