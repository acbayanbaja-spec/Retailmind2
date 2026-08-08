"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/shared/table-utils";
import {
  ExpenseCategoryFormValues,
  expenseCategoryFormSchema,
} from "@/schemas/expense.schema";
import { ExpenseCategory } from "@/types";

interface ExpenseCategoryDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: ExpenseCategoryFormValues) => Promise<void>;
  initial?: ExpenseCategory | null;
  isSubmitting?: boolean;
}

const emptyDefaults: ExpenseCategoryFormValues = {
  name: "",
  description: "",
  isActive: "true",
};

export function ExpenseCategoryDialog({
  open,
  onClose,
  onSubmit,
  initial,
  isSubmitting,
}: ExpenseCategoryDialogProps) {
  const isEdit = !!initial;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseCategoryFormValues>({
    resolver: zodResolver(expenseCategoryFormSchema),
    defaultValues: emptyDefaults,
  });

  useEffect(() => {
    if (!open) return;

    if (initial) {
      reset({
        name: initial.name,
        description: initial.description ?? "",
        isActive: initial.isActive ? "true" : "false",
      });
    } else {
      reset(emptyDefaults);
    }
  }, [open, initial, reset]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {isEdit ? "Edit category" : "Add category"}
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
          <Input
            label="Name"
            error={errors.name?.message}
            {...register("name")}
          />

          <div className="space-y-2">
            <label htmlFor="categoryDescription" className="text-sm font-medium text-foreground">
              Description
            </label>
            <textarea
              id="categoryDescription"
              rows={2}
              className="flex w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-primary/20"
              {...register("description")}
            />
          </div>

          {isEdit ? (
            <SelectField label="Status" {...register("isActive")}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </SelectField>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {isEdit ? "Save changes" : "Create category"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
