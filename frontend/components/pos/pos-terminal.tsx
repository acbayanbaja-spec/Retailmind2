"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Minus,
  Plus,
  Receipt,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { CheckoutDialog } from "@/components/pos/checkout-dialog";
import { RecentSalesPanel } from "@/components/pos/recent-sales-panel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreateSale, usePosProducts } from "@/hooks/use-sales";
import { ApiError } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";
import { CheckoutFormValues } from "@/schemas/sale.schema";
import { CartItem, PosProduct, Sale } from "@/types";

function toCartItem(product: PosProduct): CartItem {
  return {
    productId: product.id,
    sku: product.sku,
    name: product.name,
    unitPrice: product.sellingPrice,
    quantity: 1,
    maxStock: product.currentStock,
  };
}

export function PosTerminal() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [activeTab, setActiveTab] = useState<"pos" | "history">("pos");

  const { data: products, isLoading } = usePosProducts(search);
  const createSale = useCreateSale();

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cart]
  );

  function addToCart(product: PosProduct) {
    if (product.currentStock <= 0) {
      toast.error(`${product.name} is out of stock`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.currentStock) {
          toast.error(`Only ${product.currentStock} units available`);
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, maxStock: product.currentStock }
            : item
        );
      }
      return [...prev, toCartItem(product)];
    });
  }

  function updateQuantity(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId !== productId) return item;
          const nextQty = item.quantity + delta;
          if (nextQty <= 0) return null;
          if (nextQty > item.maxStock) {
            toast.error(`Only ${item.maxStock} units available`);
            return item;
          }
          return { ...item, quantity: nextQty };
        })
        .filter(Boolean) as CartItem[]
    );
  }

  function removeItem(productId: string) {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  }

  function clearCart() {
    setCart([]);
  }

  async function handleCheckout(values: CheckoutFormValues) {
    if (cart.length === 0) return;

    try {
      const sale = await createSale.mutateAsync({
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        discountAmount: values.discountAmount,
        notes: values.notes,
        payment: {
          method: values.paymentMethod,
          amount: values.amountTendered,
          referenceNo: values.referenceNo,
        },
      });
      setLastSale(sale);
      setCart([]);
      toast.success(`Sale ${sale.saleNumber} completed`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Checkout failed");
      throw err;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-border pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("pos")}
          className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "pos"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Register
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "history"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Sales history
        </button>
      </div>

      {activeTab === "history" ? (
        <RecentSalesPanel />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <Card className="space-y-4">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                setSearch(searchInput.trim());
              }}
            >
              <Input
                placeholder="Search by name, SKU, or barcode..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <Button type="submit" variant="secondary">
                <Search className="h-4 w-4" />
              </Button>
            </form>

            {isLoading ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 w-full" />
                ))}
              </div>
            ) : !products?.length ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <ShoppingCart className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No products found. Try a different search.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addToCart(product)}
                    disabled={!product.inStock}
                    className="rounded-xl border border-border bg-background p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <p className="font-medium text-foreground">{product.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {product.sku} · {product.categoryName}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-semibold text-primary">
                        {formatCurrency(product.sellingPrice)}
                      </span>
                      <span
                        className={
                          product.inStock
                            ? "text-xs text-muted-foreground"
                            : "text-xs font-medium text-danger"
                        }
                      >
                        {product.inStock ? `${product.currentStock} in stock` : "Out of stock"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card className="flex flex-col">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Current sale</h3>
              {cart.length > 0 ? (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs font-medium text-danger hover:underline"
                >
                  Clear cart
                </button>
              ) : null}
            </div>

            {cart.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center">
                <Receipt className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Add products to start a sale.
                </p>
              </div>
            ) : (
              <>
                <ul className="max-h-[360px] flex-1 space-y-3 overflow-y-auto">
                  {cart.map((item) => (
                    <li
                      key={item.productId}
                      className="rounded-xl border border-border px-3 py-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {item.name}
                          </p>
                          <p className="text-xs text-muted-foreground">{item.sku}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.productId)}
                          className="text-muted-foreground hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, -1)}
                            className="rounded-lg border border-border p-1 hover:bg-muted"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-6 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, 1)}
                            className="rounded-lg border border-border p-1 hover:bg-muted"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span className="text-sm font-semibold">
                          {formatCurrency(item.unitPrice * item.quantity)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold">
                    <span>Items</span>
                    <span>{cart.reduce((n, i) => n + i.quantity, 0)}</span>
                  </div>
                </div>

                <Button
                  className="mt-4 w-full"
                  onClick={() => setCheckoutOpen(true)}
                >
                  Checkout · {formatCurrency(subtotal)}
                </Button>
              </>
            )}
          </Card>
        </div>
      )}

      {lastSale ? (
        <Card className="border-success/30 bg-success/5">
          <p className="text-sm font-medium text-success">
            Last sale: {lastSale.saleNumber} — {formatCurrency(lastSale.totalAmount)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {lastSale.items.length} item(s) · Paid via {lastSale.payments[0]?.method}
          </p>
        </Card>
      ) : null}

      <CheckoutDialog
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        subtotal={subtotal}
        onSubmit={handleCheckout}
        isSubmitting={createSale.isPending}
      />
    </div>
  );
}
