import { SupplierDirectory } from "@/components/suppliers/supplier-directory";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function SuppliersPage() {
  return (
    <DashboardLayout
      title="Suppliers"
      description="Manage supplier profiles and vendor relationships."
    >
      <SupplierDirectory />
    </DashboardLayout>
  );
}
