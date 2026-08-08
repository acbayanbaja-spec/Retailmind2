import { z } from "zod";

export const customerFormSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional(),
  address: z.string().trim().max(500).optional(),
  city: z.string().trim().max(100).optional(),
  level: z.enum(["BRONZE", "SILVER", "GOLD", "PLATINUM"]),
  isActive: z.enum(["true", "false"]).optional(),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;

export const supplierFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  contactPerson: z.string().trim().max(100).optional(),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional(),
  address: z.string().trim().max(500).optional(),
  city: z.string().trim().max(100).optional(),
  country: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(2000).optional(),
  isActive: z.enum(["true", "false"]).optional(),
});

export type SupplierFormValues = z.infer<typeof supplierFormSchema>;
