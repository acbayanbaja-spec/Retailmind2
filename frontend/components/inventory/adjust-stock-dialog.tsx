"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/shared/table-utils";
import {
  AdjustStockFormValues,
  adjustStockSchema,
} from "@/schemas/product.schema";
import { InventoryRow } from "@/types";

interface AdjustStockDialogProps {
  open: boolean;
  onClose: () => void;
  product: InventoryRow | null;
  onSubmit: (values: AdjustStockFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export function AdjustStockDialog({
  open,
  onClose,
  product,
  onSubmit,
  isSubmitting,
}: AdjustStockDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdjustStockFormValues>({
    resolver: zodResolver(adjustStockSchema),
    defaultValues: {
      productId: "",
      type: "STOCK_IN",
      quantity: 1,
      notes: "",
    },
  });

  useEffect(() => {
    if (open && product) {
      reset({
        productId: product.productId,
        type: "STOCK_IN",
        quantity: 1,
        notes: "",
      });
    }
  }, [open, product, reset]);

  if (!open || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Adjust stock</h2>
            <p className="text-sm text-muted-foreground">
              {product.name} ({product.sku}) — current {product.currentStock}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Close
          </button>
        </div>

        <form
          className="space-y-4"
          onSubmit={handleSubmit(async (values) => {
            await onSubmit(values);
            onClose();
          })}
        >
          <input type="hidden" {...register("productId")} />

          <SelectField label="Movement type" {...register("type")}>
            <option value="STOCK_IN">Stock in (receive)</option>
            <option value="STOCK_OUT">Stock out (remove)</option>
            <option value="ADJUSTMENT">Adjustment (add units)</option>
          </SelectField>

          <Input
            label="Quantity"
            type="number"
            min={1}
            error={errors.quantity?.message}
            {...register("quantity")}
          />

          <Input
            label="Notes (optional)"
            error={errors.notes?.message}
            {...register("notes")}
          />

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Apply adjustment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
