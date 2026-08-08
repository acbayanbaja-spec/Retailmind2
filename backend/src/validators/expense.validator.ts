import { z } from "zod";

export const expenseRecurrenceEnum = z.enum([
  "NONE",
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "YEARLY",
]);

const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const listExpensesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().optional(),
  categoryId: z.string().uuid().optional(),
  recurrence: expenseRecurrenceEnum.optional(),
  dateFrom: dateOnlySchema.optional(),
  dateTo: dateOnlySchema.optional(),
});

export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;

export const createExpenseSchema = z.object({
  categoryId: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  description: z.string().trim().max(2000).optional().nullable(),
  expenseDate: dateOnlySchema,
  recurrence: expenseRecurrenceEnum.optional().default("NONE"),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const updateExpenseSchema = createExpenseSchema.partial();

export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

export const expenseIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const listExpenseCategoriesQuerySchema = z.object({
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});

export type ListExpenseCategoriesQuery = z.infer<
  typeof listExpenseCategoriesQuerySchema
>;

export const createExpenseCategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional().nullable(),
});

export type CreateExpenseCategoryInput = z.infer<
  typeof createExpenseCategorySchema
>;

export const updateExpenseCategorySchema = createExpenseCategorySchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  });

export type UpdateExpenseCategoryInput = z.infer<
  typeof updateExpenseCategorySchema
>;

export const expenseCategoryIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const expenseSummaryQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Use YYYY-MM")
    .optional(),
});

export type ExpenseSummaryQuery = z.infer<typeof expenseSummaryQuerySchema>;
