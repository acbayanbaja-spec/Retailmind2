import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLowStockProduct } from "@/types";
import { AlertTriangle } from "lucide-react";

interface LowStockListProps {
  products: DashboardLowStockProduct[];
  totalCount: number;
}

export function LowStockList({ products, totalCount }: LowStockListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Low Stock Alerts
        </CardTitle>
        <CardDescription>
          {totalCount} product{totalCount === 1 ? "" : "s"} at or below minimum stock
        </CardDescription>
      </CardHeader>
      {products.length === 0 ? (
        <p className="text-sm text-success">All products are above minimum stock levels.</p>
      ) : (
        <ul className="space-y-3">
          {products.map((product) => (
            <li
              key={product.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-warning/20 bg-warning/5 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {product.name}
                </p>
                <p className="text-xs text-muted-foreground">{product.sku}</p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-warning">
                {product.currentStock} / {product.minStock}
              </p>
            </li>
          ))}
        </ul>
      )}
      {totalCount > products.length ? (
        <Link
          href="/inventory"
          className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
        >
          View all in Inventory
        </Link>
      ) : null}
    </Card>
  );
}
