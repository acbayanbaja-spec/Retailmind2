"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/shared/table-utils";
import {
  EmployeeFormValues,
  employeeFormSchema,
  ROLE_LABELS,
  validateEmployeePassword,
} from "@/schemas/user.schema";
import { Employee, RoleOption } from "@/types";

interface EmployeeFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: EmployeeFormValues) => Promise<void>;
  initial?: Employee | null;
  roles: RoleOption[];
  isSubmitting?: boolean;
}

const emptyDefaults: EmployeeFormValues = {
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  role: "CASHIER",
  password: "",
  isActive: "true",
};

export function EmployeeFormDialog({
  open,
  onClose,
  onSubmit,
  initial,
  roles,
  isSubmitting,
}: EmployeeFormDialogProps) {
  const isEdit = !!initial;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: emptyDefaults,
  });

  useEffect(() => {
    if (!open) return;

    if (initial) {
      reset({
        email: initial.email,
        firstName: initial.firstName,
        lastName: initial.lastName,
        phone: initial.phone ?? "",
        role: initial.role,
        password: "",
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
            {isEdit ? "Edit employee" : "Add employee"}
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
            const passwordError = validateEmployeePassword(values, isEdit);
            if (passwordError) {
              setError("password", { message: passwordError });
              return;
            }
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

          <SelectField label="Role" {...register("role")}>
            {roles.map((role) => (
              <option key={role.id} value={role.name}>
                {ROLE_LABELS[role.name] ?? role.name}
              </option>
            ))}
          </SelectField>

          <Input
            label={isEdit ? "New password (optional)" : "Password"}
            type="password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />

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
              {isEdit ? "Save changes" : "Create employee"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
