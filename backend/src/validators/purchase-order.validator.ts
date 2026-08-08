import { PurchaseOrderStatus } from "@prisma/client";
import { z } from "zod";

export const listPurchaseOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().optional(),
  status: z.nativeEnum(PurchaseOrderStatus).optional(),
  supplierId: z.string().uuid().optional(),
});

export type ListPurchaseOrdersQuery = z.infer<typeof listPurchaseOrdersQuerySchema>;

export const poProductsQuerySchema = z.object({
  supplierId: z.string().uuid(),
  search: z.string().trim().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export type PoProductsQuery = z.infer<typeof poProductsQuerySchema>;

const poItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().positive(),
  unitCost: z.coerce.number().nonnegative(),
});

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().uuid(),
  notes: z.string().trim().max(2000).optional().nullable(),
  items: z.array(poItemSchema).min(1, "At least one item is required"),
});

export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;

export const updatePurchaseOrderSchema = z.object({
  supplierId: z.string().uuid().optional(),
  notes: z.string().trim().max(2000).optional().nullable(),
  items: z.array(poItemSchema).min(1).optional(),
});

export type UpdatePurchaseOrderInput = z.infer<typeof updatePurchaseOrderSchema>;

export const receivePurchaseOrderSchema = z.object({
  items: z
    .array(
      z.object({
        itemId: z.string().uuid(),
        quantity: z.coerce.number().int().positive(),
      })
    )
    .min(1, "At least one item to receive is required"),
});

export type ReceivePurchaseOrderInput = z.infer<typeof receivePurchaseOrderSchema>;

export const purchaseOrderIdParamSchema = z.object({
  id: z.string().uuid(),
});
