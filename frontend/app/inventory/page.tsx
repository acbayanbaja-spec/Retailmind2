import { InventoryManager } from "@/components/inventory/inventory-manager";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function InventoryPage() {
  return (
    <DashboardLayout
      title="Inventory"
      description="Track stock levels, movements, and low-stock alerts."
    >
      <InventoryManager />
    </DashboardLayout>
  );
}
