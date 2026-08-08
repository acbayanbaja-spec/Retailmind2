import { ActivityAction } from "@prisma/client";
import prisma from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import {
  BulkUpdateSettingsInput,
  UpdateSettingInput,
} from "../validators/setting.validator";

function mapSetting(setting: {
  id: string;
  key: string;
  value: string;
  description: string | null;
  isPublic: boolean;
  updatedAt: Date;
}) {
  return {
    id: setting.id,
    key: setting.key,
    value: setting.value,
    description: setting.description,
    isPublic: setting.isPublic,
    updatedAt: setting.updatedAt.toISOString(),
  };
}

export const settingService = {
  async list() {
    const rows = await prisma.setting.findMany({
      orderBy: { key: "asc" },
    });
    return rows.map(mapSetting);
  },

  async getByKey(key: string) {
    const setting = await prisma.setting.findUnique({ where: { key } });
    if (!setting) {
      throw new AppError("Setting not found", 404);
    }
    return mapSetting(setting);
  },

  async update(key: string, input: UpdateSettingInput, userId: string) {
    const existing = await prisma.setting.findUnique({ where: { key } });
    if (!existing) {
      throw new AppError("Setting not found", 404);
    }

    const setting = await prisma.setting.update({
      where: { key },
      data: { value: input.value },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: ActivityAction.UPDATE,
        entityType: "setting",
        entityId: setting.id,
        description: `Updated setting ${key}`,
      },
    });

    return mapSetting(setting);
  },

  async bulkUpdate(input: BulkUpdateSettingsInput, userId: string) {
    const keys = input.settings.map((s) => s.key);
    const existing = await prisma.setting.findMany({
      where: { key: { in: keys } },
    });

    if (existing.length !== keys.length) {
      throw new AppError("One or more settings were not found", 404);
    }

    const updated = await prisma.$transaction(
      input.settings.map((item) =>
        prisma.setting.update({
          where: { key: item.key },
          data: { value: item.value },
        })
      )
    );

    await prisma.activityLog.create({
      data: {
        userId,
        action: ActivityAction.UPDATE,
        entityType: "setting",
        entityId: updated[0]?.id ?? userId,
        description: `Updated ${updated.length} system settings`,
      },
    });

    return updated.map(mapSetting);
  },
};
