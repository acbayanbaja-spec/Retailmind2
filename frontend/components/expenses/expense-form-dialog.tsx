"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/shared/table-utils";
import { useExpenseCategories } from "@/hooks/use-expenses";
import {
  ExpenseFormValues,
  expenseFormSchema,
} from "@/schemas/expense.schema";
import { Expense } from "@/types";

interface ExpenseFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: ExpenseFormValues) => Promise<void>;
  initial?: Expense | null;
  isSubmitting?: boolean;
}

const RECURRENCE_OPTIONS = [
  { value: "NONE", label: "One-time" },
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY", label: "Yearly" },
] as const;

function todayDateInput(): string {
  return new Date().toISOString().slice(0, 10);
}

const emptyDefaults: ExpenseFormValues = {
  categoryId: "",
  title: "",
  amount: 0,
  description: "",
  expenseDate: todayDateInput(),
  recurrence: "NONE",
};

export function ExpenseFormDialog({
  open,
  onClose,
  onSubmit,
  initial,
  isSubmitting,
}: ExpenseFormDialogProps) {
  const isEdit = !!initial;
  const { data: categories = [] } = useExpenseCategories(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: emptyDefaults,
  });

  useEffect(() => {
    if (!open) return;

    if (initial) {
      reset({
        categoryId: initial.categoryId,
        title: initial.title,
        amount: initial.amount,
        description: initial.description ?? "",
        expenseDate: initial.expenseDate,
        recurrence: initial.recurrence,
      });
    } else {
      reset(emptyDefaults);
    }
  }, [open, initial, reset]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {isEdit ? "Edit expense" : "Record expense"}
          </h2>
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
          <div className="space-y-2">
            <SelectField label="Category" {...register("categoryId")}>
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </SelectField>
            {errors.categoryId?.message ? (
              <p className="text-xs text-danger">{errors.categoryId.message}</p>
            ) : null}
          </div>

          <Input
            label="Title"
            error={errors.title?.message}
            {...register("title")}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Amount"
              type="number"
              min={0}
              step="0.01"
              error={errors.amount?.message}
              {...register("amount")}
            />
            <Input
              label="Date"
              type="date"
              error={errors.expenseDate?.message}
              {...register("expenseDate")}
            />
          </div>

          <div className="space-y-2">
            <SelectField label="Recurrence" {...register("recurrence")}>
              {RECURRENCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectField>
            {errors.recurrence?.message ? (
              <p className="text-xs text-danger">{errors.recurrence.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-foreground">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              className="flex w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-primary/20"
              {...register("description")}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {isEdit ? "Save changes" : "Record expense"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
