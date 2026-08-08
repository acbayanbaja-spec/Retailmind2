import { z } from "zod";

export const listSuppliersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().optional(),
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});

export type ListSuppliersQuery = z.infer<typeof listSuppliersQuerySchema>;

export const createSupplierSchema = z.object({
  name: z.string().trim().min(1).max(200),
  contactPerson: z.string().trim().max(100).optional().nullable(),
  email: z.string().trim().email().optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  address: z.string().trim().max(500).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  country: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;

export const updateSupplierSchema = createSupplierSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;

export const supplierIdParamSchema = z.object({
  id: z.string().uuid(),
});
