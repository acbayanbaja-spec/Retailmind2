import { z } from "zod";

const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const reportQuerySchema = z
  .object({
    dateFrom: dateOnlySchema,
    dateTo: dateOnlySchema,
    groupBy: z.enum(["day", "week", "month"]).optional().default("day"),
  })
  .refine(
    (data) => data.dateFrom <= data.dateTo,
    { message: "dateFrom must be on or before dateTo", path: ["dateTo"] }
  );

export type ReportQuery = z.infer<typeof reportQuerySchema>;
