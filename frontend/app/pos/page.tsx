import { PosTerminal } from "@/components/pos/pos-terminal";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function POSPage() {
  return (
    <DashboardLayout
      title="Point of Sale"
      description="Process sales, accept payments, and review transactions."
    >
      <PosTerminal />
    </DashboardLayout>
  );
}
