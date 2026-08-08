import { z } from "zod";

const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const listAuditLogsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(25),
  action: z
    .enum([
      "LOGIN",
      "LOGOUT",
      "CREATE",
      "UPDATE",
      "DELETE",
      "SALE",
      "REFUND",
      "INVENTORY_ADJUSTMENT",
      "PURCHASE_ORDER",
      "EXPENSE",
      "PERMISSION_CHANGE",
      "SETTINGS_CHANGE",
    ])
    .optional(),
  userId: z.string().uuid().optional(),
  dateFrom: dateOnlySchema.optional(),
  dateTo: dateOnlySchema.optional(),
});

export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;
