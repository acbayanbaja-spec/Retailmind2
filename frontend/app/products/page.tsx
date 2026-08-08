import { ProductCatalog } from "@/components/products/product-catalog";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function ProductsPage() {
  return (
    <DashboardLayout
      title="Products"
      description="Manage product catalog, categories, and brands."
    >
      <ProductCatalog />
    </DashboardLayout>
  );
}
