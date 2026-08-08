import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { DashboardTopProduct } from "@/types";
import { Package } from "lucide-react";

interface TopProductsListProps {
  products: DashboardTopProduct[];
}

export function TopProductsList({ products }: TopProductsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Top Products
        </CardTitle>
        <CardDescription>Best sellers in the last 30 days</CardDescription>
      </CardHeader>
      {products.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sales data yet</p>
      ) : (
        <ul className="space-y-3">
          {products.map((product, index) => (
            <li
              key={product.productId}
              className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {index + 1}. {product.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {product.quantitySold} units sold
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-foreground">
                {formatCurrency(product.revenue)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
