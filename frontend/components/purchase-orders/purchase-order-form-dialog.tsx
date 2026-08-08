"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/shared/table-utils";
import { usePoProducts } from "@/hooks/use-purchase-orders";
import { useSupplierList } from "@/hooks/use-suppliers";
import { formatCurrency } from "@/lib/format";
import {
  PurchaseOrderFormValues,
  purchaseOrderFormSchema,
} from "@/schemas/purchase-order.schema";
import { PoProductOption, PurchaseOrder } from "@/types";

interface LineItemDraft {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitCost: number;
}

interface PurchaseOrderFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: PurchaseOrderFormValues) => Promise<void>;
  initial?: PurchaseOrder | null;
  isSubmitting?: boolean;
}

export function PurchaseOrderFormDialog({
  open,
  onClose,
  onSubmit,
  initial,
  isSubmitting,
}: PurchaseOrderFormDialogProps) {
  const isEdit = !!initial;
  const [supplierId, setSupplierId] = useState("");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItemDraft[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data: suppliersData } = useSupplierList({ page: 1, limit: 100, isActive: true });
  const { data: products = [] } = usePoProducts(
    supplierId ? { supplierId, limit: 100 } : null
  );

  const availableProducts = useMemo(
    () => products.filter((p) => !lineItems.some((item) => item.productId === p.id)),
    [products, lineItems]
  );

  const totalAmount = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.quantity * item.unitCost, 0),
    [lineItems]
  );

  useEffect(() => {
    if (!open) return;

    if (initial) {
      setSupplierId(initial.supplierId);
      setNotes(initial.notes ?? "");
      setLineItems(
        initial.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          quantity: item.quantity,
          unitCost: item.unitCost,
        }))
      );
    } else {
      setSupplierId("");
      setNotes("");
      setLineItems([]);
    }

    setSelectedProductId("");
    setFormError(null);
  }, [open, initial]);

  function handleSupplierChange(value: string) {
    setSupplierId(value);
    if (!initial || value !== initial.supplierId) {
      setLineItems([]);
    }
    setSelectedProductId("");
  }

  function addProduct(product: PoProductOption) {
    setLineItems((prev) => [
      ...prev,
      {
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        quantity: 1,
        unitCost: product.costPrice,
      },
    ]);
    setSelectedProductId("");
  }

  function updateLineItem(index: number, patch: Partial<LineItemDraft>) {
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  }

  function removeLineItem(index: number) {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    const payload = {
      supplierId,
      notes: notes.trim() || undefined,
      items: lineItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitCost: item.unitCost,
      })),
    };

    const parsed = purchaseOrderFormSchema.safeParse(payload);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Invalid form data");
      return;
    }

    setFormError(null);
    await onSubmit(parsed.data);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {isEdit ? `Edit ${initial?.orderNumber}` : "Create purchase order"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Close
          </button>
        </div>

        <div className="space-y-5">
          <SelectField
            label="Supplier"
            value={supplierId}
            onChange={(e) => handleSupplierChange(e.target.value)}
          >
            <option value="">Select supplier</option>
            {suppliersData?.items.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </SelectField>

          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium text-foreground">
              Notes
            </label>
            <textarea
              id="notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="flex w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-primary/20"
              placeholder="Optional delivery notes..."
            />
          </div>

          {supplierId ? (
            <div className="space-y-3 rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[220px] flex-1">
                  <SelectField
                    label="Add product"
                    value={selectedProductId}
                    onChange={(e) => {
                      const product = availableProducts.find(
                        (p) => p.id === e.target.value
                      );
                      if (product) addProduct(product);
                    }}
                  >
                    <option value="">Choose product...</option>
                    {availableProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.sku} — {product.name}
                      </option>
                    ))}
                  </SelectField>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={availableProducts.length === 0}
                  onClick={() => {
                    if (availableProducts[0]) addProduct(availableProducts[0]);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add first
                </Button>
              </div>

              {lineItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No line items yet. Add products linked to this supplier.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="pb-2 pr-3 font-medium">Product</th>
                        <th className="pb-2 pr-3 font-medium">Qty</th>
                        <th className="pb-2 pr-3 font-medium">Unit cost</th>
                        <th className="pb-2 pr-3 font-medium">Total</th>
                        <th className="pb-2 font-medium" />
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((item, index) => (
                        <tr key={item.productId} className="border-b border-border/60">
                          <td className="py-2 pr-3">
                            <p className="font-medium text-foreground">{item.productName}</p>
                            <p className="text-xs text-muted-foreground">{item.productSku}</p>
                          </td>
                          <td className="py-2 pr-3">
                            <Input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) =>
                                updateLineItem(index, {
                                  quantity: Number(e.target.value) || 1,
                                })
                              }
                            />
                          </td>
                          <td className="py-2 pr-3">
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              value={item.unitCost}
                              onChange={(e) =>
                                updateLineItem(index, {
                                  unitCost: Number(e.target.value) || 0,
                                })
                              }
                            />
                          </td>
                          <td className="py-2 pr-3 font-medium">
                            {formatCurrency(item.quantity * item.unitCost)}
                          </td>
                          <td className="py-2">
                            <button
                              type="button"
                              onClick={() => removeLineItem(index)}
                              className="text-danger hover:underline"
                              aria-label="Remove item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-end border-t border-border pt-3">
                <p className="text-sm text-muted-foreground">
                  Total:{" "}
                  <span className="font-semibold text-foreground">
                    {formatCurrency(totalAmount)}
                  </span>
                </p>
              </div>
            </div>
          ) : null}

          {formError ? <p className="text-sm text-danger">{formError}</p> : null}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" isLoading={isSubmitting} onClick={handleSave}>
              {isEdit ? "Save draft" : "Create draft"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
