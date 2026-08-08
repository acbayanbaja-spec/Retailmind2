import { z } from "zod";

export const expenseRecurrenceEnum = z.enum([
  "NONE",
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "YEARLY",
]);

export const expenseFormSchema = z.object({
  categoryId: z.string().uuid("Select a category"),
  title: z.string().trim().min(1, "Title is required").max(200),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  description: z.string().trim().max(2000).optional(),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Select a valid date"),
  recurrence: expenseRecurrenceEnum,
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

export const expenseCategoryFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  description: z.string().trim().max(500).optional(),
  isActive: z.enum(["true", "false"]).optional(),
});

export type ExpenseCategoryFormValues = z.infer<typeof expenseCategoryFormSchema>;
