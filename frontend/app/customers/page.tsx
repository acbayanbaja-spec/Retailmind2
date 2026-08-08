import { CustomerDirectory } from "@/components/customers/customer-directory";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function CustomersPage() {
  return (
    <DashboardLayout
      title="Customers"
      description="Manage customer profiles, loyalty, and purchase history."
    >
      <CustomerDirectory />
    </DashboardLayout>
  );
}
