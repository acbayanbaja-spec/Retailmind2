import { z } from "zod";

export const settingKeyParamSchema = z.object({
  key: z.string().trim().min(1).max(100),
});

export const updateSettingSchema = z.object({
  value: z.string().trim().min(1).max(2000),
});

export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;

export const bulkUpdateSettingsSchema = z.object({
  settings: z
    .array(
      z.object({
        key: z.string().trim().min(1).max(100),
        value: z.string().trim().min(1).max(2000),
      })
    )
    .min(1)
    .max(50),
});

export type BulkUpdateSettingsInput = z.infer<typeof bulkUpdateSettingsSchema>;
