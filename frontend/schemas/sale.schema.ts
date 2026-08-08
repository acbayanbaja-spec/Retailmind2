import { z } from "zod";

export const checkoutSchema = z.object({
  paymentMethod: z.enum(["CASH", "GCASH", "CARD"]),
  amountTendered: z.coerce.number().positive("Amount must be greater than zero"),
  referenceNo: z.string().trim().max(100).optional(),
  discountAmount: z.coerce.number().nonnegative(),
  notes: z.string().trim().max(500).optional(),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
