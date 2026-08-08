import { ActivityAction, InventoryTransactionType, Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { buildPaginationMeta, parsePagination } from "../utils/pagination";
import {
  AdjustInventoryInput,
  ListInventoryQuery,
  ListTransactionsQuery,
} from "../validators/inventory.validator";

function mapInventoryRow(product: {
  id: string;
  sku: string;
  name: string;
  currentStock: number;
  minStock: number;
  maxStock: number | null;
  status: string;
  category: { name: string };
  inventory: { location: string | null; lastRestockedAt: Date | null } | null;
}) {
  return {
    productId: product.id,
    sku: product.sku,
    name: product.name,
    categoryName: product.category.name,
    currentStock: product.currentStock,
    minStock: product.minStock,
    maxStock: product.maxStock,
    status: product.status,
    isLowStock: product.currentStock <= product.minStock,
    location: product.inventory?.location ?? "Main Store",
    lastRestockedAt: product.inventory?.lastRestockedAt?.toISOString() ?? null,
  };
}

function signedDelta(
  type: InventoryTransactionType,
  quantity: number
): number {
  if (type === InventoryTransactionType.STOCK_OUT) {
    return -quantity;
  }
  return quantity;
}

export const inventoryService = {
  async list(query: ListInventoryQuery) {
    const { page, limit, skip } = parsePagination(query);
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      status: "ACTIVE",
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" } },
              { sku: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(query.lowStock
        ? { currentStock: { lte: prisma.product.fields.minStock } }
        : {}),
    };

    const [total, rows] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          category: { select: { name: true } },
          inventory: { select: { location: true, lastRestockedAt: true } },
        },
        orderBy: [{ currentStock: "asc" }, { name: "asc" }],
        skip,
        take: limit,
      }),
    ]);

    return {
      items: rows.map(mapInventoryRow),
      pagination: buildPaginationMeta(page, limit, total),
    };
  },

  async listTransactions(query: ListTransactionsQuery) {
    const { page, limit, skip } = parsePagination(query);
    const where: Prisma.InventoryTransactionWhereInput = {
      ...(query.productId ? { productId: query.productId } : {}),
    };

    const [total, rows] = await Promise.all([
      prisma.inventoryTransaction.count({ where }),
      prisma.inventoryTransaction.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, sku: true } },
          performedBy: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        productId: row.productId,
        productName: row.product.name,
        productSku: row.product.sku,
        type: row.type,
        quantity: row.quantity,
        previousQty: row.previousQty,
        newQty: row.newQty,
        notes: row.notes,
        performedByName: row.performedBy
          ? `${row.performedBy.firstName} ${row.performedBy.lastName}`
          : null,
        createdAt: row.createdAt.toISOString(),
      })),
      pagination: buildPaginationMeta(page, limit, total),
    };
  },

  async adjust(input: AdjustInventoryInput, userId: string) {
    const product = await prisma.product.findFirst({
      where: { id: input.productId, deletedAt: null, status: "ACTIVE" },
      include: { inventory: true },
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    const delta = signedDelta(input.type, input.quantity);
    const previousQty = product.currentStock;
    const newQty = previousQty + delta;

    if (newQty < 0) {
      throw new AppError("Insufficient stock for this adjustment", 400);
    }

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: product.id },
        data: { currentStock: newQty },
      });

      await tx.inventory.upsert({
        where: { productId: product.id },
        create: {
          productId: product.id,
          quantity: newQty,
          lastRestockedAt:
            input.type === InventoryTransactionType.STOCK_IN ? new Date() : null,
        },
        update: {
          quantity: newQty,
          ...(input.type === InventoryTransactionType.STOCK_IN
            ? { lastRestockedAt: new Date() }
            : {}),
        },
      });

      await tx.inventoryTransaction.create({
        data: {
          productId: product.id,
          type: input.type,
          quantity: input.quantity,
          previousQty,
          newQty,
          notes: input.notes ?? null,
          performedById: userId,
          referenceType: "manual_adjustment",
        },
      });
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: ActivityAction.INVENTORY_ADJUSTMENT,
        entityType: "product",
        entityId: product.id,
        description: `${input.type} ${input.quantity} units for ${product.name} (${product.sku})`,
      },
    });

    return {
      productId: product.id,
      previousQty,
      newQty,
      type: input.type,
    };
  },

  async summary() {
    const [totalSkus, lowStockCount, totalUnits] = await Promise.all([
      prisma.product.count({ where: { deletedAt: null, status: "ACTIVE" } }),
      prisma.product.count({
        where: {
          deletedAt: null,
          status: "ACTIVE",
          currentStock: { lte: prisma.product.fields.minStock },
        },
      }),
      prisma.product.aggregate({
        where: { deletedAt: null, status: "ACTIVE" },
        _sum: { currentStock: true },
      }),
    ]);

    return {
      totalSkus,
      lowStockCount,
      totalUnits: totalUnits._sum.currentStock ?? 0,
    };
  },
};
