import { InventoryTransactionType } from "@prisma/client";
import { z } from "zod";

export const listInventoryQuerySchema = z.object({
  page: z.string().optional().transform((v) => v ? Number(v) : undefined),
  limit: z.string().optional().transform((v) => v ? Number(v) : undefined),
  search: z.string().trim().optional(),
  lowStock: z.string().optional().transform((v) => v === "true"),
});

export type ListInventoryQuery = z.infer<typeof listInventoryQuerySchema>;

export const listTransactionsQuerySchema = z.object({
  page: z.string().optional().transform((v) => v ? Number(v) : undefined),
  limit: z.string().optional().transform((v) => v ? Number(v) : undefined),
  productId: z.string().optional(),
});

export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;

const adjustTypes = [
  InventoryTransactionType.STOCK_IN,
  InventoryTransactionType.STOCK_OUT,
  InventoryTransactionType.ADJUSTMENT,
] as const;

export const adjustInventorySchema = z.object({
  productId: z.string().uuid(),
  type: z.enum(adjustTypes),
  quantity: z.coerce.number().int().positive(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export type AdjustInventoryInput = z.infer<typeof adjustInventorySchema>;
