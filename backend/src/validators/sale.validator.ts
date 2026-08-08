import { PaymentMethod } from "@prisma/client";
import { z } from "zod";

export const posProductSearchSchema = z.object({
  search: z.string().trim().optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
});

export type PosProductSearchQuery = z.infer<typeof posProductSearchSchema>;

const saleItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().positive(),
});

export const createSaleSchema = z.object({
  items: z.array(saleItemSchema).min(1, "At least one item is required"),
  customerId: z.string().uuid().optional().nullable(),
  discountAmount: z.coerce.number().nonnegative().default(0),
  notes: z.string().trim().max(500).optional().nullable(),
  payment: z.object({
    method: z.nativeEnum(PaymentMethod),
    amount: z.coerce.number().positive(),
    referenceNo: z.string().trim().max(100).optional().nullable(),
  }),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;

export const listSalesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().optional(),
  status: z.enum(["COMPLETED", "PENDING", "CANCELLED", "REFUNDED", "PARTIALLY_REFUNDED"]).optional(),
});

export type ListSalesQuery = z.infer<typeof listSalesQuerySchema>;

export const saleIdParamSchema = z.object({
  id: z.string().uuid(),
});
