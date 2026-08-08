import { ActivityAction, MembershipLevel, Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { buildPaginationMeta, parsePagination } from "../utils/pagination";
import { decimalToNumber } from "../utils/serialize";
import {
  CreateCustomerInput,
  ListCustomersQuery,
  UpdateCustomerInput,
} from "../validators/customer.validator";

function mapCustomer(customer: {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  totalSpent: Prisma.Decimal;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  membership: {
    level: MembershipLevel;
    loyaltyPoints: number;
  } | null;
  _count?: { sales: number };
}) {
  return {
    id: customer.id,
    firstName: customer.firstName,
    lastName: customer.lastName,
    fullName: `${customer.firstName} ${customer.lastName}`,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    city: customer.city,
    totalSpent: decimalToNumber(customer.totalSpent),
    isActive: customer.isActive,
    membership: customer.membership,
    salesCount: customer._count?.sales ?? 0,
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
  };
}

export const customerService = {
  async list(query: ListCustomersQuery) {
    const { page, limit, skip } = parsePagination(query);
    const where: Prisma.CustomerWhereInput = {
      deletedAt: null,
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.search
        ? {
            OR: [
              { firstName: { contains: query.search, mode: "insensitive" } },
              { lastName: { contains: query.search, mode: "insensitive" } },
              { email: { contains: query.search, mode: "insensitive" } },
              { phone: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        include: {
          membership: { select: { level: true, loyaltyPoints: true } },
          _count: { select: { sales: true } },
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        skip,
        take: limit,
      }),
    ]);

    return {
      items: rows.map(mapCustomer),
      pagination: buildPaginationMeta(page, limit, total),
    };
  },

  async getById(id: string) {
    const customer = await prisma.customer.findFirst({
      where: { id, deletedAt: null },
      include: {
        membership: { select: { level: true, loyaltyPoints: true, joinedAt: true } },
        _count: { select: { sales: true } },
        sales: {
          where: { deletedAt: null, status: "COMPLETED" },
          select: {
            id: true,
            saleNumber: true,
            totalAmount: true,
            completedAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!customer) {
      throw new AppError("Customer not found", 404);
    }

    return {
      ...mapCustomer(customer),
      recentSales: customer.sales.map((sale) => ({
        id: sale.id,
        saleNumber: sale.saleNumber,
        totalAmount: decimalToNumber(sale.totalAmount),
        completedAt: sale.completedAt?.toISOString() ?? null,
        createdAt: sale.createdAt.toISOString(),
      })),
    };
  },

  async create(input: CreateCustomerInput, userId: string) {
    if (input.email) {
      const existing = await prisma.customer.findFirst({
        where: { email: input.email, deletedAt: null },
      });
      if (existing) {
        throw new AppError("Email already in use", 409);
      }
    }

    const customer = await prisma.$transaction(async (tx) => {
      const created = await tx.customer.create({
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email ?? null,
          phone: input.phone ?? null,
          address: input.address ?? null,
          city: input.city ?? null,
        },
        include: {
          membership: { select: { level: true, loyaltyPoints: true } },
          _count: { select: { sales: true } },
        },
      });

      await tx.customerMembership.create({
        data: {
          customerId: created.id,
          level: input.level ?? MembershipLevel.BRONZE,
        },
      });

      return tx.customer.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          membership: { select: { level: true, loyaltyPoints: true } },
          _count: { select: { sales: true } },
        },
      });
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: ActivityAction.CREATE,
        entityType: "customer",
        entityId: customer.id,
        description: `Created customer ${customer.firstName} ${customer.lastName}`,
      },
    });

    return mapCustomer(customer);
  },

  async update(id: string, input: UpdateCustomerInput, userId: string) {
    const existing = await prisma.customer.findFirst({
      where: { id, deletedAt: null },
      include: { membership: true },
    });
    if (!existing) {
      throw new AppError("Customer not found", 404);
    }

    if (input.email && input.email !== existing.email) {
      const duplicate = await prisma.customer.findFirst({
        where: { email: input.email, deletedAt: null, NOT: { id } },
      });
      if (duplicate) {
        throw new AppError("Email already in use", 409);
      }
    }

    const customer = await prisma.$transaction(async (tx) => {
      await tx.customer.update({
        where: { id },
        data: {
          ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
          ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
          ...(input.email !== undefined ? { email: input.email } : {}),
          ...(input.phone !== undefined ? { phone: input.phone } : {}),
          ...(input.address !== undefined ? { address: input.address } : {}),
          ...(input.city !== undefined ? { city: input.city } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        },
      });

      if (input.level !== undefined) {
        if (existing.membership) {
          await tx.customerMembership.update({
            where: { customerId: id },
            data: { level: input.level },
          });
        } else {
          await tx.customerMembership.create({
            data: { customerId: id, level: input.level },
          });
        }
      }

      return tx.customer.findUniqueOrThrow({
        where: { id },
        include: {
          membership: { select: { level: true, loyaltyPoints: true } },
          _count: { select: { sales: true } },
        },
      });
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: ActivityAction.UPDATE,
        entityType: "customer",
        entityId: id,
        description: `Updated customer ${customer.firstName} ${customer.lastName}`,
      },
    });

    return mapCustomer(customer);
  },

  async remove(id: string, userId: string) {
    const existing = await prisma.customer.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new AppError("Customer not found", 404);
    }

    await prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: ActivityAction.DELETE,
        entityType: "customer",
        entityId: id,
        description: `Archived customer ${existing.firstName} ${existing.lastName}`,
      },
    });
  },
};
