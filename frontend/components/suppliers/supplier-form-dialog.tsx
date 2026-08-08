"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/shared/table-utils";
import {
  SupplierFormValues,
  supplierFormSchema,
} from "@/schemas/customer.schema";
import { Supplier } from "@/types";

interface SupplierFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: SupplierFormValues) => Promise<void>;
  initial?: Supplier | null;
  isSubmitting?: boolean;
}

const emptyDefaults: SupplierFormValues = {
  name: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  country: "Philippines",
  notes: "",
  isActive: "true",
};

export function SupplierFormDialog({
  open,
  onClose,
  onSubmit,
  initial,
  isSubmitting,
}: SupplierFormDialogProps) {
  const isEdit = !!initial;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: emptyDefaults,
  });

  useEffect(() => {
    if (!open) return;

    if (initial) {
      reset({
        name: initial.name,
        contactPerson: initial.contactPerson ?? "",
        email: initial.email ?? "",
        phone: initial.phone ?? "",
        address: initial.address ?? "",
        city: initial.city ?? "",
        country: initial.country ?? "Philippines",
        notes: initial.notes ?? "",
        isActive: initial.isActive ? "true" : "false",
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
            {isEdit ? "Edit supplier" : "Add supplier"}
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
            label="Company name"
            error={errors.name?.message}
            {...register("name")}
          />

          <Input
            label="Contact person"
            error={errors.contactPerson?.message}
            {...register("contactPerson")}
          />

          <Input
            label="Email"
            type="email"
            error={errors.email?.message}
            {...register("email")}
          />

          <Input
            label="Phone"
            error={errors.phone?.message}
            {...register("phone")}
          />

          <Input
            label="Address"
            error={errors.address?.message}
            {...register("address")}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="City" error={errors.city?.message} {...register("city")} />
            <Input
              label="Country"
              error={errors.country?.message}
              {...register("country")}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium text-foreground">
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              className="flex w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-primary/20"
              {...register("notes")}
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
              {isEdit ? "Save changes" : "Create supplier"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
