import { ActivityAction, Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { buildPaginationMeta, parsePagination } from "../utils/pagination";
import {
  CreateSupplierInput,
  ListSuppliersQuery,
  UpdateSupplierInput,
} from "../validators/supplier.validator";

function mapSupplier(supplier: {
  id: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: { products: number; purchaseOrders: number };
}) {
  return {
    id: supplier.id,
    name: supplier.name,
    contactPerson: supplier.contactPerson,
    email: supplier.email,
    phone: supplier.phone,
    address: supplier.address,
    city: supplier.city,
    country: supplier.country,
    notes: supplier.notes,
    isActive: supplier.isActive,
    productCount: supplier._count?.products ?? 0,
    purchaseOrderCount: supplier._count?.purchaseOrders ?? 0,
    createdAt: supplier.createdAt.toISOString(),
    updatedAt: supplier.updatedAt.toISOString(),
  };
}

export const supplierService = {
  async list(query: ListSuppliersQuery) {
    const { page, limit, skip } = parsePagination(query);
    const where: Prisma.SupplierWhereInput = {
      deletedAt: null,
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" } },
              { contactPerson: { contains: query.search, mode: "insensitive" } },
              { email: { contains: query.search, mode: "insensitive" } },
              { phone: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      prisma.supplier.count({ where }),
      prisma.supplier.findMany({
        where,
        include: {
          _count: { select: { products: true, purchaseOrders: true } },
        },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      items: rows.map(mapSupplier),
      pagination: buildPaginationMeta(page, limit, total),
    };
  },

  async getById(id: string) {
    const supplier = await prisma.supplier.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: { select: { products: true, purchaseOrders: true } },
        products: {
          where: { deletedAt: null },
          select: { id: true, name: true, sku: true, status: true },
          orderBy: { name: "asc" },
          take: 10,
        },
      },
    });

    if (!supplier) {
      throw new AppError("Supplier not found", 404);
    }

    const { products, ...rest } = supplier;
    return {
      ...mapSupplier(rest),
      linkedProducts: products,
    };
  },

  async create(input: CreateSupplierInput, userId: string) {
    const supplier = await prisma.supplier.create({
      data: {
        name: input.name,
        contactPerson: input.contactPerson ?? null,
        email: input.email ?? null,
        phone: input.phone ?? null,
        address: input.address ?? null,
        city: input.city ?? null,
        country: input.country ?? "Philippines",
        notes: input.notes ?? null,
      },
      include: {
        _count: { select: { products: true, purchaseOrders: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: ActivityAction.CREATE,
        entityType: "supplier",
        entityId: supplier.id,
        description: `Created supplier ${supplier.name}`,
      },
    });

    return mapSupplier(supplier);
  },

  async update(id: string, input: UpdateSupplierInput, userId: string) {
    const existing = await prisma.supplier.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new AppError("Supplier not found", 404);
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.contactPerson !== undefined
          ? { contactPerson: input.contactPerson }
          : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.address !== undefined ? { address: input.address } : {}),
        ...(input.city !== undefined ? { city: input.city } : {}),
        ...(input.country !== undefined ? { country: input.country } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
      include: {
        _count: { select: { products: true, purchaseOrders: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: ActivityAction.UPDATE,
        entityType: "supplier",
        entityId: id,
        description: `Updated supplier ${supplier.name}`,
      },
    });

    return mapSupplier(supplier);
  },

  async remove(id: string, userId: string) {
    const existing = await prisma.supplier.findFirst({
      where: { id, deletedAt: null },
      include: { _count: { select: { products: true } } },
    });
    if (!existing) {
      throw new AppError("Supplier not found", 404);
    }

    if (existing._count.products > 0) {
      throw new AppError(
        "Cannot archive supplier with linked products. Reassign products first.",
        400
      );
    }

    await prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: ActivityAction.DELETE,
        entityType: "supplier",
        entityId: id,
        description: `Archived supplier ${existing.name}`,
      },
    });
  },
};
