import { z } from "zod";

const roleEnum = z.enum(["ADMINISTRATOR", "STORE_MANAGER", "CASHIER"]);

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[a-z]/, "Must contain at least one lowercase letter")
  .regex(/[0-9]/, "Must contain at least one number");

export const employeeFormSchema = z.object({
  email: z.string().trim().email("Invalid email"),
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  phone: z.string().trim().max(30).optional(),
  role: roleEnum,
  password: z.string().optional(),
  isActive: z.enum(["true", "false"]).optional(),
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

export function validateEmployeePassword(
  values: EmployeeFormValues,
  isEdit: boolean
): string | null {
  if (!values.password) {
    return isEdit ? null : "Password is required for new employees";
  }
  const result = passwordSchema.safeParse(values.password);
  return result.success ? null : (result.error.errors[0]?.message ?? "Invalid password");
}

export const ROLE_LABELS: Record<EmployeeFormValues["role"], string> = {
  ADMINISTRATOR: "Administrator",
  STORE_MANAGER: "Store Manager",
  CASHIER: "Cashier",
};
