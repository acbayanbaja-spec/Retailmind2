import { ActivityAction, Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { endOfDay, startOfDay } from "../utils/date";
import { ListAuditLogsQuery } from "../validators/audit.validator";

function parseDateOnly(value: string): Date {
  return startOfDay(new Date(`${value}T00:00:00`));
}

export const auditService = {
  async listActivityLogs(query: ListAuditLogsQuery) {
    const where: Prisma.ActivityLogWhereInput = {};

    if (query.action) {
      where.action = query.action as ActivityAction;
    }
    if (query.userId) {
      where.userId = query.userId;
    }
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) {
        where.createdAt.gte = parseDateOnly(query.dateFrom);
      }
      if (query.dateTo) {
        where.createdAt.lte = endOfDay(parseDateOnly(query.dateTo));
      }
    }

    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: query.limit,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          description: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.activityLog.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        action: item.action,
        entityType: item.entityType,
        entityId: item.entityId,
        description: item.description,
        ipAddress: item.ipAddress,
        userAgent: item.userAgent,
        createdAt: item.createdAt.toISOString(),
        user: item.user
          ? {
              id: item.user.id,
              email: item.user.email,
              firstName: item.user.firstName,
              lastName: item.user.lastName,
            }
          : null,
      })),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  },
};
