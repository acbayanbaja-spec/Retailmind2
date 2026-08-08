import { z } from "zod";

export const poLineItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().positive("Quantity must be at least 1"),
  unitCost: z.coerce.number().nonnegative("Unit cost must be 0 or more"),
});

export const purchaseOrderFormSchema = z.object({
  supplierId: z.string().uuid("Select a supplier"),
  notes: z.string().trim().max(2000).optional(),
  items: z.array(poLineItemSchema).min(1, "Add at least one product"),
});

export type PurchaseOrderFormValues = z.infer<typeof purchaseOrderFormSchema>;

export const receiveGoodsSchema = z.object({
  items: z
    .array(
      z.object({
        itemId: z.string().uuid(),
        quantity: z.coerce.number().int().positive(),
      })
    )
    .min(1, "Enter quantity for at least one item"),
});

export type ReceiveGoodsFormValues = z.infer<typeof receiveGoodsSchema>;
