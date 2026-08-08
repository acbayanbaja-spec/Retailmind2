import { z } from "zod";

export const productFormSchema = z.object({
  sku: z.string().trim().min(1, "SKU is required").max(50),
  barcode: z.string().trim().max(50).optional(),
  name: z.string().trim().min(1, "Name is required").max(200),
  description: z.string().trim().max(2000).optional(),
  categoryId: z.string().uuid("Select a category"),
  brandId: z.string().uuid().optional().or(z.literal("")),
  supplierId: z.string().uuid().optional().or(z.literal("")),
  costPrice: z.coerce.number().nonnegative("Must be 0 or more"),
  sellingPrice: z.coerce.number().nonnegative("Must be 0 or more"),
  currentStock: z.coerce.number().int().nonnegative().optional(),
  minStock: z.coerce.number().int().nonnegative(),
  maxStock: z.coerce.number().int().positive().optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE", "DISCONTINUED"]),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const adjustStockSchema = z.object({
  productId: z.string().uuid(),
  type: z.enum(["STOCK_IN", "STOCK_OUT", "ADJUSTMENT"]),
  quantity: z.coerce.number().int().positive("Quantity must be at least 1"),
  notes: z.string().trim().max(500).optional(),
});

export type AdjustStockFormValues = z.infer<typeof adjustStockSchema>;
