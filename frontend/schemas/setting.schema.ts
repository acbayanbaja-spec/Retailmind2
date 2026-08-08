import { z } from "zod";

export const settingsFormSchema = z.object({
  settings: z.array(
    z.object({
      key: z.string(),
      value: z.string().trim().min(1, "Value is required"),
      description: z.string().nullable().optional(),
      isPublic: z.boolean().optional(),
    })
  ),
});

export type SettingsFormValues = z.infer<typeof settingsFormSchema>;
