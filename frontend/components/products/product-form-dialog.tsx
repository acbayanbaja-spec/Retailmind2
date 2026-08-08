"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/shared/table-utils";
import { ProductFormValues, productFormSchema } from "@/schemas/product.schema";
import { Product } from "@/types";

interface ProductFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  initial?: Product | null;
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
  suppliers: { id: string; name: string }[];
  isSubmitting?: boolean;
}

const emptyDefaults: ProductFormValues = {
  sku: "",
  barcode: "",
  name: "",
  description: "",
  categoryId: "",
  brandId: "",
  supplierId: "",
  costPrice: 0,
  sellingPrice: 0,
  currentStock: 0,
  minStock: 5,
  maxStock: "",
  status: "ACTIVE",
};

export function ProductFormDialog({
  open,
  onClose,
  onSubmit,
  initial,
  categories,
  brands,
  suppliers,
  isSubmitting,
}: ProductFormDialogProps) {
  const isEdit = !!initial;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: emptyDefaults,
  });

  useEffect(() => {
    if (!open) return;

    if (initial) {
      reset({
        sku: initial.sku,
        barcode: initial.barcode ?? "",
        name: initial.name,
        description: initial.description ?? "",
        categoryId: initial.categoryId,
        brandId: initial.brandId ?? "",
        supplierId: initial.supplierId ?? "",
        costPrice: initial.costPrice,
        sellingPrice: initial.sellingPrice,
        minStock: initial.minStock,
        maxStock: initial.maxStock ?? "",
        status: initial.status,
      });
    } else {
      reset(emptyDefaults);
    }
  }, [open, initial, reset]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {isEdit ? "Edit product" : "Add product"}
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
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={handleSubmit(async (values) => {
            await onSubmit(values);
            onClose();
          })}
        >
          <Input label="SKU" error={errors.sku?.message} {...register("sku")} />
          <Input
            label="Barcode"
            error={errors.barcode?.message}
            {...register("barcode")}
          />
          <div className="sm:col-span-2">
            <Input label="Name" error={errors.name?.message} {...register("name")} />
          </div>
          <div className="sm:col-span-2">
            <Input
              label="Description"
              error={errors.description?.message}
              {...register("description")}
            />
          </div>

          <SelectField label="Category" {...register("categoryId")}>
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>

          <SelectField label="Status" {...register("status")}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="DISCONTINUED">Discontinued</option>
          </SelectField>

          <SelectField label="Brand (optional)" {...register("brandId")}>
            <option value="">None</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </SelectField>

          <SelectField label="Supplier (optional)" {...register("supplierId")}>
            <option value="">None</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </SelectField>

          <Input
            label="Cost price"
            type="number"
            step="0.01"
            error={errors.costPrice?.message}
            {...register("costPrice")}
          />
          <Input
            label="Selling price"
            type="number"
            step="0.01"
            error={errors.sellingPrice?.message}
            {...register("sellingPrice")}
          />

          {!isEdit ? (
            <Input
              label="Initial stock"
              type="number"
              error={errors.currentStock?.message}
              {...register("currentStock")}
            />
          ) : null}

          <Input
            label="Minimum stock"
            type="number"
            error={errors.minStock?.message}
            {...register("minStock")}
          />
          <Input
            label="Maximum stock (optional)"
            type="number"
            error={errors.maxStock?.message}
            {...register("maxStock")}
          />

          <div className="flex justify-end gap-3 sm:col-span-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {isEdit ? "Save changes" : "Create product"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
