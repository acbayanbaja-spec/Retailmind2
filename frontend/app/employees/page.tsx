import { EmployeeDirectory } from "@/components/employees/employee-directory";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function EmployeesPage() {
  return (
    <DashboardLayout
      title="Employees"
      description="Manage employee accounts, roles, and permissions."
    >
      <EmployeeDirectory />
    </DashboardLayout>
  );
}
