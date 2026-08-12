import { ProductStatus } from "@prisma/client";
import { z } from "zod";

export const listProductsQuerySchema = z.object({
  page: z.string().optional().transform((v) => v ? Number(v) : undefined),
  limit: z.string().optional().transform((v) => v ? Number(v) : undefined),
  search: z.string().trim().optional(),
  categoryId: z.string().optional(),
  status: z.string().optional(),
  lowStock: z.string().optional().transform((v) => v === "true"),
});

export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;

export const createProductSchema = z.object({
  sku: z.string().trim().min(1).max(50),
  barcode: z.string().trim().max(50).optional().nullable(),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  categoryId: z.string().uuid(),
  brandId: z.string().uuid().optional().nullable(),
  supplierId: z.string().uuid().optional().nullable(),
  costPrice: z.coerce.number().nonnegative(),
  sellingPrice: z.coerce.number().nonnegative(),
  currentStock: z.coerce.number().int().nonnegative().default(0),
  minStock: z.coerce.number().int().nonnegative().default(5),
  maxStock: z.coerce.number().int().positive().optional().nullable(),
  status: z.nativeEnum(ProductStatus).default(ProductStatus.ACTIVE),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema
  .partial()
  .omit({ currentStock: true });

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const productIdParamSchema = z.object({
  id: z.string().uuid(),
});
