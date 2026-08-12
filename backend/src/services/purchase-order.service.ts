import {
  ActivityAction,
  InventoryTransactionType,
  Prisma,
  PurchaseOrderStatus,
} from "@prisma/client";
import prisma from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { buildPaginationMeta, parsePagination } from "../utils/pagination";
import { decimalToNumber } from "../utils/serialize";
import {
  CreatePurchaseOrderInput,
  ListPurchaseOrdersQuery,
  PoProductsQuery,
  ReceivePurchaseOrderInput,
  UpdatePurchaseOrderInput,
} from "../validators/purchase-order.validator";

const poInclude = {
  supplier: { select: { id: true, name: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
  items: {
    include: {
      product: { select: { id: true, name: true, sku: true } },
    },
    orderBy: { product: { name: "asc" as const } },
  },
} satisfies Prisma.PurchaseOrderInclude;

type PoWithRelations = Prisma.PurchaseOrderGetPayload<{ include: typeof poInclude }>;

function mapPurchaseOrder(po: PoWithRelations) {
  const items = po.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    productName: item.product.name,
    productSku: item.product.sku,
    quantity: item.quantity,
    receivedQty: item.receivedQty,
    remainingQty: item.quantity - item.receivedQty,
    unitCost: decimalToNumber(item.unitCost),
    totalCost: decimalToNumber(item.totalCost),
  }));

  return {
    id: po.id,
    orderNumber: po.orderNumber,
    supplierId: po.supplierId,
    supplierName: po.supplier.name,
    status: po.status,
    totalAmount: decimalToNumber(po.totalAmount),
    notes: po.notes,
    orderedAt: po.orderedAt?.toISOString() ?? null,
    receivedAt: po.receivedAt?.toISOString() ?? null,
    createdById: po.createdById,
    createdByName: `${po.createdBy.firstName} ${po.createdBy.lastName}`,
    createdAt: po.createdAt.toISOString(),
    updatedAt: po.updatedAt.toISOString(),
    items,
    totalOrderedQty: items.reduce((sum, item) => sum + item.quantity, 0),
    totalReceivedQty: items.reduce((sum, item) => sum + item.receivedQty, 0),
  };
}

async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PO-${year}-`;

  const last = await prisma.purchaseOrder.findFirst({
    where: { orderNumber: { startsWith: prefix } },
    orderBy: { createdAt: "desc" },
    select: { orderNumber: true },
  });

  let next = 1;
  if (last?.orderNumber) {
    const match = last.orderNumber.match(/(\d+)$/);
    if (match) {
      next = parseInt(match[1], 10) + 1;
    }
  }

  return `${prefix}${String(next).padStart(4, "0")}`;
}

async function getPoOrThrow(id: string): Promise<PoWithRelations> {
  const po = await prisma.purchaseOrder.findFirst({
    where: { id, deletedAt: null },
    include: poInclude,
  });
  if (!po) {
    throw new AppError("Purchase order not found", 404);
  }
  return po;
}

async function validateLineItems(
  supplierId: string,
  items: Array<{ productId: string; quantity: number; unitCost: number }>
) {
  const productIds = items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      deletedAt: null,
      status: "ACTIVE",
      supplierId,
    },
  });

  if (products.length !== productIds.length) {
    throw new AppError(
      "One or more products are invalid or not linked to this supplier",
      400
    );
  }

  return products;
}

function buildItemRows(items: Array<{ productId: string; quantity: number; unitCost: number }>) {
  return items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    unitCost: item.unitCost,
    totalCost: Math.round(item.quantity * item.unitCost * 100) / 100,
  }));
}

function assertEditable(status: PurchaseOrderStatus) {
  if (status !== PurchaseOrderStatus.DRAFT) {
    throw new AppError("Only draft purchase orders can be edited", 400);
  }
}

function assertReceivable(status: PurchaseOrderStatus) {
  if (
    status !== PurchaseOrderStatus.APPROVED &&
    status !== PurchaseOrderStatus.ORDERED &&
    status !== PurchaseOrderStatus.PARTIALLY_RECEIVED
  ) {
    throw new AppError("Purchase order is not ready to receive goods", 400);
  }
}

function assertCancellable(po: PoWithRelations) {
  if (
    po.status === PurchaseOrderStatus.RECEIVED ||
    po.status === PurchaseOrderStatus.CANCELLED
  ) {
    throw new AppError("This purchase order cannot be cancelled", 400);
  }
  if (po.items.some((item) => item.receivedQty > 0)) {
    throw new AppError("Cannot cancel a purchase order with received items", 400);
  }
}

export const purchaseOrderService = {
  async listProducts(query: PoProductsQuery) {
    const limit = query.limit ?? 50;
    const products = await prisma.product.findMany({
      where: {
        deletedAt: null,
        status: "ACTIVE",
        supplierId: query.supplierId,
        ...(query.search
          ? {
              OR: [
                { name: { contains: query.search, mode: "insensitive" } },
                { sku: { contains: query.search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        sku: true,
        name: true,
        costPrice: true,
        currentStock: true,
        minStock: true,
      },
      orderBy: { name: "asc" },
      take: limit,
    });

    return products.map((product) => ({
      id: product.id,
      sku: product.sku,
      name: product.name,
      costPrice: decimalToNumber(product.costPrice),
      currentStock: product.currentStock,
      minStock: product.minStock,
      isLowStock: product.currentStock <= product.minStock,
    }));
  },

  async list(query: ListPurchaseOrdersQuery) {
    const { page, limit, skip } = parsePagination(query);
    const where: Prisma.PurchaseOrderWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status as any } : {}),
      ...(query.supplierId ? { supplierId: query.supplierId } : {}),
      ...(query.search
        ? {
            OR: [
              { orderNumber: { contains: query.search, mode: "insensitive" } },
              {
                supplier: {
                  name: { contains: query.search, mode: "insensitive" },
                },
              },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      prisma.purchaseOrder.count({ where }),
      prisma.purchaseOrder.findMany({
        where,
        include: poInclude,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      items: rows.map(mapPurchaseOrder),
      pagination: buildPaginationMeta(page, limit, total),
    };
  },

  async getById(id: string) {
    const po = await getPoOrThrow(id);
    return mapPurchaseOrder(po);
  },

  async create(input: CreatePurchaseOrderInput, userId: string) {
    const supplier = await prisma.supplier.findFirst({
      where: { id: input.supplierId, deletedAt: null, isActive: true },
    });
    if (!supplier) {
      throw new AppError("Supplier not found", 404);
    }

    await validateLineItems(input.supplierId, input.items);
    const lineItems = buildItemRows(input.items);
    const totalAmount = lineItems.reduce((sum, item) => sum + item.totalCost, 0);
    const orderNumber = await generateOrderNumber();

    const po = await prisma.purchaseOrder.create({
      data: {
        orderNumber,
        supplierId: input.supplierId,
        status: PurchaseOrderStatus.DRAFT,
        totalAmount,
        notes: input.notes ?? null,
        createdById: userId,
        items: { create: lineItems },
      },
      include: poInclude,
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: ActivityAction.PURCHASE_ORDER,
        entityType: "purchase_order",
        entityId: po.id,
        description: `Created purchase order ${orderNumber}`,
      },
    });

    return mapPurchaseOrder(po);
  },

  async update(id: string, input: UpdatePurchaseOrderInput, userId: string) {
    const existing = await getPoOrThrow(id);
    assertEditable(existing.status);

    const supplierId = input.supplierId ?? existing.supplierId;
    if (input.supplierId) {
      const supplier = await prisma.supplier.findFirst({
        where: { id: supplierId, deletedAt: null, isActive: true },
      });
      if (!supplier) {
        throw new AppError("Supplier not found", 404);
      }
    }

    let lineItems = existing.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitCost: decimalToNumber(item.unitCost),
    }));

    if (input.items) {
      await validateLineItems(supplierId, input.items);
      lineItems = input.items;
    }

    const rows = buildItemRows(lineItems);
    const totalAmount = rows.reduce((sum, item) => sum + item.totalCost, 0);

    const po = await prisma.$transaction(async (tx) => {
      await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } });

      return tx.purchaseOrder.update({
        where: { id },
        data: {
          ...(input.supplierId ? { supplierId: input.supplierId } : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
          totalAmount,
          items: { create: rows },
        },
        include: poInclude,
      });
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: ActivityAction.UPDATE,
        entityType: "purchase_order",
        entityId: id,
        description: `Updated purchase order ${po.orderNumber}`,
      },
    });

    return mapPurchaseOrder(po);
  },

  async submit(id: string, userId: string) {
    const po = await getPoOrThrow(id);
    if (po.status !== PurchaseOrderStatus.DRAFT) {
      throw new AppError("Only draft purchase orders can be submitted", 400);
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: { status: PurchaseOrderStatus.PENDING },
      include: poInclude,
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: ActivityAction.PURCHASE_ORDER,
        entityType: "purchase_order",
        entityId: id,
        description: `Submitted purchase order ${po.orderNumber} for approval`,
      },
    });

    return mapPurchaseOrder(updated);
  },

  async approve(id: string, userId: string) {
    const po = await getPoOrThrow(id);
    if (
      po.status !== PurchaseOrderStatus.PENDING &&
      po.status !== PurchaseOrderStatus.DRAFT
    ) {
      throw new AppError("Purchase order cannot be approved in its current status", 400);
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: { status: PurchaseOrderStatus.APPROVED },
      include: poInclude,
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: ActivityAction.PURCHASE_ORDER,
        entityType: "purchase_order",
        entityId: id,
        description: `Approved purchase order ${po.orderNumber}`,
      },
    });

    return mapPurchaseOrder(updated);
  },

  async markOrdered(id: string, userId: string) {
    const po = await getPoOrThrow(id);
    if (po.status !== PurchaseOrderStatus.APPROVED) {
      throw new AppError("Only approved purchase orders can be marked as ordered", 400);
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: PurchaseOrderStatus.ORDERED,
        orderedAt: new Date(),
      },
      include: poInclude,
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: ActivityAction.PURCHASE_ORDER,
        entityType: "purchase_order",
        entityId: id,
        description: `Marked purchase order ${po.orderNumber} as ordered`,
      },
    });

    return mapPurchaseOrder(updated);
  },

  async receive(id: string, input: ReceivePurchaseOrderInput, userId: string) {
    const po = await getPoOrThrow(id);
    assertReceivable(po.status);

    const itemMap = new Map(po.items.map((item) => [item.id, item]));

    for (const entry of input.items) {
      const line = itemMap.get(entry.itemId);
      if (!line) {
        throw new AppError("Invalid purchase order line item", 400);
      }
      const remaining = line.quantity - line.receivedQty;
      if (entry.quantity > remaining) {
        throw new AppError(
          `Cannot receive ${entry.quantity} units of ${line.product.name}; only ${remaining} remaining`,
          400
        );
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      for (const entry of input.items) {
        const line = itemMap.get(entry.itemId)!;
        const newReceivedQty = line.receivedQty + entry.quantity;

        await tx.purchaseOrderItem.update({
          where: { id: entry.itemId },
          data: { receivedQty: newReceivedQty },
        });

        const product = await tx.product.findUniqueOrThrow({
          where: { id: line.productId },
        });
        const previousQty = product.currentStock;
        const newQty = previousQty + entry.quantity;

        await tx.product.update({
          where: { id: line.productId },
          data: {
            currentStock: newQty,
            costPrice: line.unitCost,
          },
        });

        await tx.inventory.upsert({
          where: { productId: line.productId },
          create: {
            productId: line.productId,
            quantity: newQty,
            lastRestockedAt: new Date(),
          },
          update: {
            quantity: newQty,
            lastRestockedAt: new Date(),
          },
        });

        await tx.inventoryTransaction.create({
          data: {
            productId: line.productId,
            type: InventoryTransactionType.PURCHASE,
            quantity: entry.quantity,
            previousQty,
            newQty,
            referenceType: "purchase_order",
            referenceId: id,
            notes: `Received from ${po.orderNumber}`,
            performedById: userId,
          },
        });

        line.receivedQty = newReceivedQty;
      }

      const refreshedItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: id },
      });

      const allReceived = refreshedItems.every(
        (item) => item.receivedQty >= item.quantity
      );
      const anyReceived = refreshedItems.some((item) => item.receivedQty > 0);

      let nextStatus = po.status;
      let receivedAt: Date | null | undefined = undefined;

      if (allReceived) {
        nextStatus = PurchaseOrderStatus.RECEIVED;
        receivedAt = new Date();
      } else if (anyReceived) {
        nextStatus = PurchaseOrderStatus.PARTIALLY_RECEIVED;
      }

      return tx.purchaseOrder.update({
        where: { id },
        data: {
          status: nextStatus,
          ...(receivedAt !== undefined ? { receivedAt } : {}),
        },
        include: poInclude,
      });
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: ActivityAction.PURCHASE_ORDER,
        entityType: "purchase_order",
        entityId: id,
        description: `Received goods for purchase order ${po.orderNumber}`,
      },
    });

    return mapPurchaseOrder(updated);
  },

  async cancel(id: string, userId: string) {
    const po = await getPoOrThrow(id);
    assertCancellable(po);

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: { status: PurchaseOrderStatus.CANCELLED },
      include: poInclude,
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: ActivityAction.PURCHASE_ORDER,
        entityType: "purchase_order",
        entityId: id,
        description: `Cancelled purchase order ${po.orderNumber}`,
      },
    });

    return mapPurchaseOrder(updated);
  },

  async remove(id: string, userId: string) {
    const po = await getPoOrThrow(id);
    if (
      po.status !== PurchaseOrderStatus.DRAFT &&
      po.status !== PurchaseOrderStatus.CANCELLED
    ) {
      throw new AppError("Only draft or cancelled purchase orders can be deleted", 400);
    }

    await prisma.purchaseOrder.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: ActivityAction.DELETE,
        entityType: "purchase_order",
        entityId: id,
        description: `Archived purchase order ${po.orderNumber}`,
      },
    });
  },
};
