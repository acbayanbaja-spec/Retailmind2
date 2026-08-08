import { ActivityAction, ExpenseRecurrence, Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { endOfDay, startOfDay } from "../utils/date";
import { buildPaginationMeta, parsePagination } from "../utils/pagination";
import {
  CreateExpenseCategoryInput,
  CreateExpenseInput,
  ExpenseSummaryQuery,
  ListExpenseCategoriesQuery,
  ListExpensesQuery,
  UpdateExpenseCategoryInput,
  UpdateExpenseInput,
} from "../validators/expense.validator";

function decimalToNumber(value: { toNumber(): number } | number): number {
  return typeof value === "number" ? value : value.toNumber();
}

function parseDateOnly(value: string): Date {
  return startOfDay(new Date(`${value}T00:00:00`));
}

function mapExpense(expense: {
  id: string;
  categoryId: string;
  title: string;
  amount: { toNumber(): number } | number;
  description: string | null;
  expenseDate: Date;
  recurrence: ExpenseRecurrence;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  category: { id: string; name: string };
  createdBy: { firstName: string; lastName: string };
}) {
  return {
    id: expense.id,
    categoryId: expense.categoryId,
    categoryName: expense.category.name,
    title: expense.title,
    amount: decimalToNumber(expense.amount),
    description: expense.description,
    expenseDate: expense.expenseDate.toISOString().slice(0, 10),
    recurrence: expense.recurrence,
    createdById: expense.createdById,
    createdByName: `${expense.createdBy.firstName} ${expense.createdBy.lastName}`,
    createdAt: expense.createdAt.toISOString(),
    updatedAt: expense.updatedAt.toISOString(),
  };
}

function mapCategory(category: {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: { expenses: number };
}) {
  return {
    id: category.id,
    name: category.name,
    description: category.description,
    isActive: category.isActive,
    expenseCount: category._count?.expenses ?? 0,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

const expenseInclude = {
  category: { select: { id: true, name: true } },
  createdBy: { select: { firstName: true, lastName: true } },
} as const;

export const expenseService = {
  async list(query: ListExpensesQuery) {
    const { page, limit, skip } = parsePagination(query);
    const where: Prisma.ExpenseWhereInput = {
      deletedAt: null,
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.recurrence ? { recurrence: query.recurrence } : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            expenseDate: {
              ...(query.dateFrom ? { gte: parseDateOnly(query.dateFrom) } : {}),
              ...(query.dateTo ? { lte: endOfDay(parseDateOnly(query.dateTo)) } : {}),
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: "insensitive" } },
              { description: { contains: query.search, mode: "insensitive" } },
              { category: { name: { contains: query.search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      prisma.expense.count({ where }),
      prisma.expense.findMany({
        where,
        include: expenseInclude,
        orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
    ]);

    return {
      items: rows.map(mapExpense),
      pagination: buildPaginationMeta(page, limit, total),
    };
  },

  async getById(id: string) {
    const expense = await prisma.expense.findFirst({
      where: { id, deletedAt: null },
      include: expenseInclude,
    });

    if (!expense) {
      throw new AppError("Expense not found", 404);
    }

    return mapExpense(expense);
  },

  async create(input: CreateExpenseInput, userId: string) {
    const category = await prisma.expenseCategory.findFirst({
      where: { id: input.categoryId, deletedAt: null, isActive: true },
    });
    if (!category) {
      throw new AppError("Expense category not found or inactive", 400);
    }

    const expense = await prisma.expense.create({
      data: {
        categoryId: input.categoryId,
        title: input.title,
        amount: input.amount,
        description: input.description ?? null,
        expenseDate: parseDateOnly(input.expenseDate),
        recurrence: input.recurrence ?? ExpenseRecurrence.NONE,
        createdById: userId,
      },
      include: expenseInclude,
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: ActivityAction.CREATE,
        entityType: "expense",
        entityId: expense.id,
        description: `Recorded expense ${expense.title}`,
      },
    });

    return mapExpense(expense);
  },

  async update(id: string, input: UpdateExpenseInput, userId: string) {
    const existing = await prisma.expense.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new AppError("Expense not found", 404);
    }

    if (input.categoryId) {
      const category = await prisma.expenseCategory.findFirst({
        where: { id: input.categoryId, deletedAt: null, isActive: true },
      });
      if (!category) {
        throw new AppError("Expense category not found or inactive", 400);
      }
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.amount !== undefined ? { amount: input.amount } : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.expenseDate !== undefined
          ? { expenseDate: parseDateOnly(input.expenseDate) }
          : {}),
        ...(input.recurrence !== undefined ? { recurrence: input.recurrence } : {}),
      },
      include: expenseInclude,
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: ActivityAction.UPDATE,
        entityType: "expense",
        entityId: id,
        description: `Updated expense ${expense.title}`,
      },
    });

    return mapExpense(expense);
  },

  async remove(id: string, userId: string) {
    const existing = await prisma.expense.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new AppError("Expense not found", 404);
    }

    await prisma.expense.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: ActivityAction.DELETE,
        entityType: "expense",
        entityId: id,
        description: `Archived expense ${existing.title}`,
      },
    });
  },

  async getSummary(query: ExpenseSummaryQuery) {
    const now = new Date();
    const [year, month] = (query.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`)
      .split("-")
      .map(Number);

    const periodStart = startOfDay(new Date(year, month - 1, 1));
    const periodEnd = endOfDay(new Date(year, month, 0));

    const where: Prisma.ExpenseWhereInput = {
      deletedAt: null,
      expenseDate: { gte: periodStart, lte: periodEnd },
    };

    const [aggregate, byCategory, recurringCount] = await Promise.all([
      prisma.expense.aggregate({
        where,
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.expense.groupBy({
        by: ["categoryId"],
        where,
        _sum: { amount: true },
        _count: { id: true },
        orderBy: { _sum: { amount: "desc" } },
      }),
      prisma.expense.count({
        where: {
          ...where,
          recurrence: { not: ExpenseRecurrence.NONE },
        },
      }),
    ]);

    const categoryIds = byCategory.map((row) => row.categoryId);
    const categories = await prisma.expenseCategory.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });
    const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

    return {
      month: `${year}-${String(month).padStart(2, "0")}`,
      totalAmount: decimalToNumber(aggregate._sum.amount ?? 0),
      expenseCount: aggregate._count.id,
      recurringCount,
      byCategory: byCategory.map((row) => ({
        categoryId: row.categoryId,
        categoryName: categoryNameById.get(row.categoryId) ?? "Unknown",
        totalAmount: decimalToNumber(row._sum.amount ?? 0),
        expenseCount: row._count.id,
      })),
    };
  },

  async listCategories(query: ListExpenseCategoriesQuery) {
    const where: Prisma.ExpenseCategoryWhereInput = {
      deletedAt: null,
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
    };

    const rows = await prisma.expenseCategory.findMany({
      where,
      include: {
        _count: {
          select: {
            expenses: { where: { deletedAt: null } },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return rows.map(mapCategory);
  },

  async createCategory(input: CreateExpenseCategoryInput, userId: string) {
    const existing = await prisma.expenseCategory.findFirst({
      where: { name: input.name, deletedAt: null },
    });
    if (existing) {
      throw new AppError("Category name already exists", 409);
    }

    const category = await prisma.expenseCategory.create({
      data: {
        name: input.name,
        description: input.description ?? null,
      },
      include: {
        _count: {
          select: {
            expenses: { where: { deletedAt: null } },
          },
        },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: ActivityAction.CREATE,
        entityType: "expense_category",
        entityId: category.id,
        description: `Created expense category ${category.name}`,
      },
    });

    return mapCategory(category);
  },

  async updateCategory(
    id: string,
    input: UpdateExpenseCategoryInput,
    userId: string
  ) {
    const existing = await prisma.expenseCategory.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new AppError("Expense category not found", 404);
    }

    if (input.name && input.name !== existing.name) {
      const duplicate = await prisma.expenseCategory.findFirst({
        where: { name: input.name, deletedAt: null, id: { not: id } },
      });
      if (duplicate) {
        throw new AppError("Category name already exists", 409);
      }
    }

    const category = await prisma.expenseCategory.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
      include: {
        _count: {
          select: {
            expenses: { where: { deletedAt: null } },
          },
        },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: ActivityAction.UPDATE,
        entityType: "expense_category",
        entityId: id,
        description: `Updated expense category ${category.name}`,
      },
    });

    return mapCategory(category);
  },

  async removeCategory(id: string, userId: string) {
    const existing = await prisma.expenseCategory.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: {
          select: {
            expenses: { where: { deletedAt: null } },
          },
        },
      },
    });
    if (!existing) {
      throw new AppError("Expense category not found", 404);
    }

    if (existing._count.expenses > 0) {
      throw new AppError(
        "Cannot archive category with linked expenses. Reassign expenses first.",
        400
      );
    }

    await prisma.expenseCategory.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: ActivityAction.DELETE,
        entityType: "expense_category",
        entityId: id,
        description: `Archived expense category ${existing.name}`,
      },
    });
  },
};
