import { ExpenseManager } from "@/components/expenses/expense-manager";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function ExpensesPage() {
  return (
    <DashboardLayout
      title="Expenses"
      description="Track business expenses and recurring costs."
    >
      <ExpenseManager />
    </DashboardLayout>
  );
}
