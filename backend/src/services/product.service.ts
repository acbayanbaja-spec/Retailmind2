import { ActivityAction, Prisma, ProductStatus } from "@prisma/client";
import prisma from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { buildPaginationMeta, parsePagination } from "../utils/pagination";
import { decimalToNumber } from "../utils/serialize";
import {
  CreateProductInput,
  ListProductsQuery,
  UpdateProductInput,
} from "../validators/product.validator";

const productInclude = {
  category: { select: { id: true, name: true } },
  brand: { select: { id: true, name: true } },
  supplier: { select: { id: true, name: true } },
} satisfies Prisma.ProductInclude;

function mapProduct(product: {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  description: string | null;
  categoryId: string;
  brandId: string | null;
  supplierId: string | null;
  costPrice: Prisma.Decimal;
  sellingPrice: Prisma.Decimal;
  currentStock: number;
  minStock: number;
  maxStock: number | null;
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
  category: { id: string; name: string };
  brand: { id: string; name: string } | null;
  supplier: { id: string; name: string } | null;
}) {
  return {
    id: product.id,
    sku: product.sku,
    barcode: product.barcode,
    name: product.name,
    description: product.description,
    categoryId: product.categoryId,
    brandId: product.brandId,
    supplierId: product.supplierId,
    costPrice: decimalToNumber(product.costPrice),
    sellingPrice: decimalToNumber(product.sellingPrice),
    currentStock: product.currentStock,
    minStock: product.minStock,
    maxStock: product.maxStock,
    status: product.status,
    isLowStock: product.currentStock <= product.minStock,
    category: product.category,
    brand: product.brand,
    supplier: product.supplier,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

async function logProductActivity(
  userId: string,
  action: ActivityAction,
  productId: string,
  description: string
) {
  await prisma.activityLog.create({
    data: {
      userId,
      action,
      entityType: "product",
      entityId: productId,
      description,
    },
  });
}

export const productService = {
  async list(query: ListProductsQuery) {
    const { page, limit, skip } = parsePagination(query);
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status as any } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" } },
              { sku: { contains: query.search, mode: "insensitive" } },
              { barcode: { contains: query.search, mode: "insensitive" } },
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
        include: productInclude,
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      items: rows.map(mapProduct),
      pagination: buildPaginationMeta(page, limit, total),
    };
  },

  async getById(id: string) {
    const product = await prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: productInclude,
    });
    if (!product) {
      throw new AppError("Product not found", 404);
    }
    return mapProduct(product);
  },

  async create(input: CreateProductInput, userId: string) {
    const existingSku = await prisma.product.findFirst({
      where: { sku: input.sku, deletedAt: null },
    });
    if (existingSku) {
      throw new AppError("SKU already exists", 409);
    }

    if (input.barcode) {
      const existingBarcode = await prisma.product.findFirst({
        where: { barcode: input.barcode, deletedAt: null },
      });
      if (existingBarcode) {
        throw new AppError("Barcode already exists", 409);
      }
    }

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          sku: input.sku,
          barcode: input.barcode ?? null,
          name: input.name,
          description: input.description ?? null,
          categoryId: input.categoryId,
          brandId: input.brandId ?? null,
          supplierId: input.supplierId ?? null,
          costPrice: input.costPrice,
          sellingPrice: input.sellingPrice,
          currentStock: input.currentStock,
          minStock: input.minStock,
          maxStock: input.maxStock ?? null,
          status: input.status,
        },
        include: productInclude,
      });

      await tx.inventory.create({
        data: {
          productId: created.id,
          quantity: input.currentStock,
          lastRestockedAt: input.currentStock > 0 ? new Date() : null,
        },
      });

      if (input.currentStock > 0) {
        await tx.inventoryTransaction.create({
          data: {
            productId: created.id,
            type: "STOCK_IN",
            quantity: input.currentStock,
            previousQty: 0,
            newQty: input.currentStock,
            referenceType: "product_create",
            referenceId: created.id,
            notes: "Initial stock on product creation",
            performedById: userId,
          },
        });
      }

      return created;
    });

    await logProductActivity(
      userId,
      ActivityAction.CREATE,
      product.id,
      `Created product ${product.name} (${product.sku})`
    );

    return mapProduct(product);
  },

  async update(id: string, input: UpdateProductInput, userId: string) {
    const existing = await prisma.product.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new AppError("Product not found", 404);
    }

    if (input.sku && input.sku !== existing.sku) {
      const duplicate = await prisma.product.findFirst({
        where: { sku: input.sku, deletedAt: null, NOT: { id } },
      });
      if (duplicate) {
        throw new AppError("SKU already exists", 409);
      }
    }

    if (input.barcode && input.barcode !== existing.barcode) {
      const duplicate = await prisma.product.findFirst({
        where: { barcode: input.barcode, deletedAt: null, NOT: { id } },
      });
      if (duplicate) {
        throw new AppError("Barcode already exists", 409);
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(input.sku !== undefined ? { sku: input.sku } : {}),
        ...(input.barcode !== undefined ? { barcode: input.barcode } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
        ...(input.brandId !== undefined ? { brandId: input.brandId } : {}),
        ...(input.supplierId !== undefined ? { supplierId: input.supplierId } : {}),
        ...(input.costPrice !== undefined ? { costPrice: input.costPrice } : {}),
        ...(input.sellingPrice !== undefined
          ? { sellingPrice: input.sellingPrice }
          : {}),
        ...(input.minStock !== undefined ? { minStock: input.minStock } : {}),
        ...(input.maxStock !== undefined ? { maxStock: input.maxStock } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
      include: productInclude,
    });

    await logProductActivity(
      userId,
      ActivityAction.UPDATE,
      product.id,
      `Updated product ${product.name} (${product.sku})`
    );

    return mapProduct(product);
  },

  async remove(id: string, userId: string) {
    const existing = await prisma.product.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new AppError("Product not found", 404);
    }

    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), status: ProductStatus.INACTIVE },
    });

    await logProductActivity(
      userId,
      ActivityAction.DELETE,
      id,
      `Archived product ${existing.name} (${existing.sku})`
    );
  },

  async listCategories() {
    return prisma.category.findMany({
      where: { deletedAt: null, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  },

  async listBrands() {
    return prisma.brand.findMany({
      where: { deletedAt: null, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  },

  async listSuppliers() {
    return prisma.supplier.findMany({
      where: { deletedAt: null, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  },
};
