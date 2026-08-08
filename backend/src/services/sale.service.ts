import {
  ActivityAction,
  InventoryTransactionType,
  LoyaltyTransactionType,
  Prisma,
  SaleStatus,
} from "@prisma/client";
import prisma from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { buildPaginationMeta, parsePagination } from "../utils/pagination";
import { decimalToNumber } from "../utils/serialize";
import {
  CreateSaleInput,
  ListSalesQuery,
  PosProductSearchQuery,
} from "../validators/sale.validator";

const saleInclude = {
  customer: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  cashier: { select: { id: true, firstName: true, lastName: true } },
  items: {
    include: {
      product: { select: { id: true, name: true, sku: true } },
    },
  },
  payments: true,
} satisfies Prisma.SaleInclude;

function mapSale(sale: {
  id: string;
  saleNumber: string;
  customerId: string | null;
  cashierId: string;
  status: SaleStatus;
  subtotal: Prisma.Decimal;
  discountAmount: Prisma.Decimal;
  taxAmount: Prisma.Decimal;
  totalAmount: Prisma.Decimal;
  loyaltyPointsEarned: number;
  notes: string | null;
  completedAt: Date | null;
  createdAt: Date;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
  } | null;
  cashier: { id: string; firstName: string; lastName: string };
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    unitPrice: Prisma.Decimal;
    discountAmount: Prisma.Decimal;
    totalPrice: Prisma.Decimal;
    product: { id: string; name: string; sku: string };
  }>;
  payments: Array<{
    id: string;
    method: string;
    amount: Prisma.Decimal;
    status: string;
    referenceNo: string | null;
    paidAt: Date;
  }>;
}) {
  return {
    id: sale.id,
    saleNumber: sale.saleNumber,
    customerId: sale.customerId,
    cashierId: sale.cashierId,
    status: sale.status,
    subtotal: decimalToNumber(sale.subtotal),
    discountAmount: decimalToNumber(sale.discountAmount),
    taxAmount: decimalToNumber(sale.taxAmount),
    totalAmount: decimalToNumber(sale.totalAmount),
    loyaltyPointsEarned: sale.loyaltyPointsEarned,
    notes: sale.notes,
    completedAt: sale.completedAt?.toISOString() ?? null,
    createdAt: sale.createdAt.toISOString(),
    customer: sale.customer
      ? {
          id: sale.customer.id,
          name: `${sale.customer.firstName} ${sale.customer.lastName}`,
          email: sale.customer.email,
        }
      : null,
    cashierName: `${sale.cashier.firstName} ${sale.cashier.lastName}`,
    items: sale.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      productSku: item.product.sku,
      quantity: item.quantity,
      unitPrice: decimalToNumber(item.unitPrice),
      discountAmount: decimalToNumber(item.discountAmount),
      totalPrice: decimalToNumber(item.totalPrice),
    })),
    payments: sale.payments.map((payment) => ({
      id: payment.id,
      method: payment.method,
      amount: decimalToNumber(payment.amount),
      status: payment.status,
      referenceNo: payment.referenceNo,
      paidAt: payment.paidAt.toISOString(),
    })),
  };
}

async function getTaxRate(): Promise<number> {
  const setting = await prisma.setting.findUnique({ where: { key: "tax.rate" } });
  return setting ? parseFloat(setting.value) : 0.12;
}

async function getLoyaltyPointsPer100(): Promise<number> {
  const setting = await prisma.setting.findUnique({
    where: { key: "loyalty.points_per_100" },
  });
  return setting ? parseInt(setting.value, 10) : 1;
}

async function generateSaleNumber(): Promise<string> {
  const last = await prisma.sale.findFirst({
    orderBy: { createdAt: "desc" },
    select: { saleNumber: true },
  });

  let next = 1;
  if (last?.saleNumber) {
    const match = last.saleNumber.match(/(\d+)$/);
    if (match) {
      next = parseInt(match[1], 10) + 1;
    }
  }

  return `SALE-${String(next).padStart(6, "0")}`;
}

export const saleService = {
  async searchProducts(query: PosProductSearchQuery) {
    const limit = query.limit ?? 24;
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      status: "ACTIVE",
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" } },
              { sku: { contains: query.search, mode: "insensitive" } },
              { barcode: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        sku: true,
        barcode: true,
        name: true,
        sellingPrice: true,
        currentStock: true,
        category: { select: { name: true } },
      },
      orderBy: { name: "asc" },
      take: limit,
    });

    return products.map((product) => ({
      id: product.id,
      sku: product.sku,
      barcode: product.barcode,
      name: product.name,
      sellingPrice: decimalToNumber(product.sellingPrice),
      currentStock: product.currentStock,
      categoryName: product.category.name,
      inStock: product.currentStock > 0,
    }));
  },

  async list(query: ListSalesQuery) {
    const { page, limit, skip } = parsePagination(query);
    const where: Prisma.SaleWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { saleNumber: { contains: query.search, mode: "insensitive" } },
              {
                customer: {
                  OR: [
                    { firstName: { contains: query.search, mode: "insensitive" } },
                    { lastName: { contains: query.search, mode: "insensitive" } },
                  ],
                },
              },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      prisma.sale.count({ where }),
      prisma.sale.findMany({
        where,
        include: saleInclude,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      items: rows.map(mapSale),
      pagination: buildPaginationMeta(page, limit, total),
    };
  },

  async getById(id: string) {
    const sale = await prisma.sale.findFirst({
      where: { id, deletedAt: null },
      include: saleInclude,
    });
    if (!sale) {
      throw new AppError("Sale not found", 404);
    }
    return mapSale(sale);
  },

  async create(input: CreateSaleInput, cashierId: string) {
    const productIds = input.items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        deletedAt: null,
        status: "ACTIVE",
      },
    });

    if (products.length !== productIds.length) {
      throw new AppError("One or more products are unavailable", 400);
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    const lineItems: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }> = [];

    for (const item of input.items) {
      const product = productMap.get(item.productId)!;
      if (product.currentStock < item.quantity) {
        throw new AppError(
          `Insufficient stock for ${product.name} (${product.sku})`,
          400
        );
      }

      const unitPrice = decimalToNumber(product.sellingPrice);
      lineItems.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice,
        totalPrice: unitPrice * item.quantity,
      });
    }

    const subtotal = lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const discountAmount = input.discountAmount ?? 0;

    if (discountAmount > subtotal) {
      throw new AppError("Discount cannot exceed subtotal", 400);
    }

    const taxableBase = subtotal - discountAmount;
    const taxRate = await getTaxRate();
    const taxAmount = Math.round(taxableBase * taxRate * 100) / 100;
    const totalAmount = Math.round((taxableBase + taxAmount) * 100) / 100;

    if (input.payment.amount < totalAmount) {
      throw new AppError("Payment amount is less than total due", 400);
    }

    if (input.customerId) {
      const customer = await prisma.customer.findFirst({
        where: { id: input.customerId, deletedAt: null, isActive: true },
      });
      if (!customer) {
        throw new AppError("Customer not found", 404);
      }
    }

    const pointsPer100 = await getLoyaltyPointsPer100();
    const loyaltyPointsEarned = Math.floor(totalAmount / 100) * pointsPer100;
    const saleNumber = await generateSaleNumber();
    const now = new Date();

    const sale = await prisma.$transaction(async (tx) => {
      const created = await tx.sale.create({
        data: {
          saleNumber,
          customerId: input.customerId ?? null,
          cashierId,
          status: SaleStatus.COMPLETED,
          subtotal,
          discountAmount,
          taxAmount,
          totalAmount,
          loyaltyPointsEarned,
          notes: input.notes ?? null,
          completedAt: now,
          items: {
            create: lineItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
            })),
          },
          payments: {
            create: {
              method: input.payment.method,
              amount: input.payment.amount,
              referenceNo: input.payment.referenceNo ?? null,
            },
          },
        },
        include: saleInclude,
      });

      for (const item of lineItems) {
        const product = productMap.get(item.productId)!;
        const previousQty = product.currentStock;
        const newQty = previousQty - item.quantity;

        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: newQty },
        });

        await tx.inventory.upsert({
          where: { productId: item.productId },
          create: { productId: item.productId, quantity: newQty },
          update: { quantity: newQty },
        });

        await tx.inventoryTransaction.create({
          data: {
            productId: item.productId,
            type: InventoryTransactionType.SALE,
            quantity: item.quantity,
            previousQty,
            newQty,
            referenceType: "sale",
            referenceId: created.id,
            notes: `Sale ${saleNumber}`,
            performedById: cashierId,
          },
        });

        product.currentStock = newQty;
      }

      if (input.customerId) {
        await tx.customer.update({
          where: { id: input.customerId },
          data: { totalSpent: { increment: totalAmount } },
        });

        if (loyaltyPointsEarned > 0) {
          const membership = await tx.customerMembership.findUnique({
            where: { customerId: input.customerId },
          });

          if (membership) {
            const newBalance = membership.loyaltyPoints + loyaltyPointsEarned;
            await tx.customerMembership.update({
              where: { customerId: input.customerId },
              data: { loyaltyPoints: newBalance },
            });

            await tx.loyaltyTransaction.create({
              data: {
                customerId: input.customerId,
                type: LoyaltyTransactionType.EARN,
                points: loyaltyPointsEarned,
                balanceAfter: newBalance,
                referenceType: "sale",
                referenceId: created.id,
                description: `Points earned from ${saleNumber}`,
              },
            });
          }
        }
      }

      return created;
    });

    await prisma.activityLog.create({
      data: {
        userId: cashierId,
        action: ActivityAction.SALE,
        entityType: "sale",
        entityId: sale.id,
        description: `Sale ${saleNumber} completed — ₱${totalAmount.toFixed(2)}`,
      },
    });

    return mapSale(sale);
  },
};
