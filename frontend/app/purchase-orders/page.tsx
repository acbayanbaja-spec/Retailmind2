import { PurchaseOrderManager } from "@/components/purchase-orders/purchase-order-manager";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function PurchaseOrdersPage() {
  return (
    <DashboardLayout
      title="Purchase Orders"
      description="Create and manage supplier purchase orders."
    >
      <PurchaseOrderManager />
    </DashboardLayout>
  );
}
