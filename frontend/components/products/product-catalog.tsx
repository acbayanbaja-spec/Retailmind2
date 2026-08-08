"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Package, Plus, Search } from "lucide-react";
import { ProductFormDialog } from "@/components/products/product-form-dialog";
import { Pagination, StatusBadge } from "@/components/shared/table-utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SelectField } from "@/components/shared/table-utils";
import {
  useProductCatalog,
  useProductMeta,
  useProductMutations,
} from "@/hooks/use-products";
import { formatCurrency } from "@/lib/format";
import { ProductFormValues } from "@/schemas/product.schema";
import { Product } from "@/types";
import { ApiError } from "@/lib/api-client";

function toPayload(values: ProductFormValues, isEdit: boolean) {
  return {
    sku: values.sku,
    barcode: values.barcode || null,
    name: values.name,
    description: values.description || null,
    categoryId: values.categoryId,
    brandId: values.brandId || null,
    supplierId: values.supplierId || null,
    costPrice: values.costPrice,
    sellingPrice: values.sellingPrice,
    minStock: values.minStock,
    maxStock: values.maxStock === "" ? null : Number(values.maxStock),
    status: values.status,
    ...(!isEdit ? { currentStock: values.currentStock ?? 0 } : {}),
  };
}

export function ProductCatalog() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const params = useMemo(
    () => ({
      page,
      limit: 15,
      search: search || undefined,
      categoryId: categoryId || undefined,
      status: status || undefined,
      lowStock: lowStockOnly || undefined,
    }),
    [page, search, categoryId, status, lowStockOnly]
  );

  const { data, isLoading, isError, refetch } = useProductCatalog(params);
  const { data: meta } = useProductMeta();
  const { create, update, archive } = useProductMutations();

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setDialogOpen(true);
  }

  async function handleSubmit(values: ProductFormValues) {
    try {
      const payload = toPayload(values, !!editing);
      if (editing) {
        await update.mutateAsync({ id: editing.id, payload });
        toast.success("Product updated");
      } else {
        await create.mutateAsync(payload);
        toast.success("Product created");
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Request failed");
      throw err;
    }
  }

  async function handleArchive(product: Product) {
    if (!confirm(`Archive ${product.name}? This will deactivate the product.`)) {
      return;
    }
    try {
      await archive.mutateAsync(product.id);
      toast.success("Product archived");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Archive failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Product catalog</h2>
          <p className="text-sm text-muted-foreground">
            Manage SKUs, pricing, and stock thresholds.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add product
        </Button>
      </div>

      <Card className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <form
            className="flex gap-2 xl:col-span-2"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setSearch(searchInput.trim());
            }}
          >
            <Input
              placeholder="Search name, SKU, barcode..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <Button type="submit" variant="secondary">
              <Search className="h-4 w-4" />
            </Button>
          </form>

          <SelectField
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All categories</option>
            {meta?.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>

          <SelectField
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="DISCONTINUED">Discontinued</option>
          </SelectField>

          <SelectField
            value={lowStockOnly ? "true" : "false"}
            onChange={(e) => {
              setLowStockOnly(e.target.value === "true");
              setPage(1);
            }}
          >
            <option value="false">All stock levels</option>
            <option value="true">Low stock only</option>
          </SelectField>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : isError || !data ? (
          <div className="py-10 text-center">
            <p className="text-sm text-muted-foreground">Could not load products.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 text-sm font-medium text-primary hover:underline"
            >
              Retry
            </button>
          </div>
        ) : data.items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Package className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No products match your filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Product</th>
                    <th className="pb-3 pr-4 font-medium">Category</th>
                    <th className="pb-3 pr-4 font-medium">Price</th>
                    <th className="pb-3 pr-4 font-medium">Stock</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((product) => (
                    <tr key={product.id} className="border-b border-border/60">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-foreground">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sku}</p>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {product.category.name}
                      </td>
                      <td className="py-3 pr-4">
                        <p>{formatCurrency(product.sellingPrice)}</p>
                        <p className="text-xs text-muted-foreground">
                          Cost {formatCurrency(product.costPrice)}
                        </p>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={
                            product.isLowStock
                              ? "font-semibold text-warning"
                              : "text-foreground"
                          }
                        >
                          {product.currentStock}
                        </span>
                        <span className="text-muted-foreground"> / {product.minStock}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge
                          status={product.status}
                          isLowStock={product.isLowStock}
                        />
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(product)}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleArchive(product)}
                            className="text-sm font-medium text-danger hover:underline"
                          >
                            Archive
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pagination={data.pagination} onPageChange={setPage} />
          </>
        )}
      </Card>

      <ProductFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        initial={editing}
        categories={meta?.categories ?? []}
        brands={meta?.brands ?? []}
        suppliers={meta?.suppliers ?? []}
        isSubmitting={create.isPending || update.isPending}
      />
    </div>
  );
}
