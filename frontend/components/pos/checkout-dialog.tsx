"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/shared/table-utils";
import { formatCurrency } from "@/lib/format";
import { CheckoutFormValues, checkoutSchema } from "@/schemas/sale.schema";

const TAX_RATE = 0.12;

interface CheckoutDialogProps {
  open: boolean;
  onClose: () => void;
  subtotal: number;
  onSubmit: (values: CheckoutFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export function CheckoutDialog({
  open,
  onClose,
  subtotal,
  onSubmit,
  isSubmitting,
}: CheckoutDialogProps) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: "CASH",
      amountTendered: 0,
      discountAmount: 0,
      referenceNo: "",
      notes: "",
    },
  });

  const paymentMethod = watch("paymentMethod");
  const discountAmount = watch("discountAmount") || 0;
  const amountTendered = watch("amountTendered") || 0;

  const taxableBase = Math.max(subtotal - discountAmount, 0);
  const taxAmount = Math.round(taxableBase * TAX_RATE * 100) / 100;
  const totalDue = Math.round((taxableBase + taxAmount) * 100) / 100;
  const change = Math.max(amountTendered - totalDue, 0);

  useEffect(() => {
    if (!open) return;
    reset({
      paymentMethod: "CASH",
      amountTendered: totalDue,
      discountAmount: 0,
      referenceNo: "",
      notes: "",
    });
  }, [open, subtotal, reset, totalDue]);

  useEffect(() => {
    if (paymentMethod !== "CASH") {
      setValue("amountTendered", totalDue);
    }
  }, [paymentMethod, totalDue, setValue]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Complete payment</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Close
          </button>
        </div>

        <div className="mb-6 space-y-2 rounded-xl bg-muted/50 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Discount</span>
            <span>-{formatCurrency(discountAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">VAT (12%)</span>
            <span>{formatCurrency(taxAmount)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
            <span>Total due</span>
            <span className="text-primary">{formatCurrency(totalDue)}</span>
          </div>
        </div>

        <form
          className="space-y-4"
          onSubmit={handleSubmit(async (values) => {
            if (values.amountTendered < totalDue) return;
            await onSubmit(values);
            onClose();
          })}
        >
          <SelectField label="Payment method" {...register("paymentMethod")}>
            <option value="CASH">Cash</option>
            <option value="GCASH">GCash</option>
            <option value="CARD">Card</option>
          </SelectField>

          <Input
            label="Discount (₱)"
            type="number"
            step="0.01"
            min={0}
            error={errors.discountAmount?.message}
            {...register("discountAmount")}
          />

          <Input
            label={paymentMethod === "CASH" ? "Amount tendered" : "Amount paid"}
            type="number"
            step="0.01"
            min={0}
            error={errors.amountTendered?.message}
            {...register("amountTendered")}
          />

          {paymentMethod === "CASH" && amountTendered >= totalDue ? (
            <p className="text-sm font-medium text-success">
              Change: {formatCurrency(change)}
            </p>
          ) : null}

          {paymentMethod !== "CASH" ? (
            <Input
              label="Reference no. (optional)"
              error={errors.referenceNo?.message}
              {...register("referenceNo")}
            />
          ) : null}

          <Input
            label="Notes (optional)"
            error={errors.notes?.message}
            {...register("notes")}
          />

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={amountTendered < totalDue}
            >
              Complete sale
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function computeSaleTotal(subtotal: number, discountAmount: number) {
  const taxableBase = Math.max(subtotal - discountAmount, 0);
  const taxAmount = Math.round(taxableBase * TAX_RATE * 100) / 100;
  const totalDue = Math.round((taxableBase + taxAmount) * 100) / 100;
  return { taxAmount, totalDue };
}
