"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/shared/table-utils";
import {
  CustomerFormValues,
  customerFormSchema,
} from "@/schemas/customer.schema";
import { Customer } from "@/types";

interface CustomerFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CustomerFormValues) => Promise<void>;
  initial?: Customer | null;
  isSubmitting?: boolean;
}

const emptyDefaults: CustomerFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  level: "BRONZE",
  isActive: "true",
};

export function CustomerFormDialog({
  open,
  onClose,
  onSubmit,
  initial,
  isSubmitting,
}: CustomerFormDialogProps) {
  const isEdit = !!initial;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: emptyDefaults,
  });

  useEffect(() => {
    if (!open) return;

    if (initial) {
      reset({
        firstName: initial.firstName,
        lastName: initial.lastName,
        email: initial.email ?? "",
        phone: initial.phone ?? "",
        address: initial.address ?? "",
        city: initial.city ?? "",
        level: initial.membership?.level ?? "BRONZE",
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
            {isEdit ? "Edit customer" : "Add customer"}
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
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="First name"
              error={errors.firstName?.message}
              {...register("firstName")}
            />
            <Input
              label="Last name"
              error={errors.lastName?.message}
              {...register("lastName")}
            />
          </div>

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

          <Input label="City" error={errors.city?.message} {...register("city")} />

          <SelectField label="Membership level" {...register("level")}>
            <option value="BRONZE">Bronze</option>
            <option value="SILVER">Silver</option>
            <option value="GOLD">Gold</option>
            <option value="PLATINUM">Platinum</option>
          </SelectField>

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
              {isEdit ? "Save changes" : "Create customer"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
