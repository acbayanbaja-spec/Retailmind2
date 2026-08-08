import { ActivityAction, Prisma, UserRoleName } from "@prisma/client";
import prisma from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { buildPaginationMeta, parsePagination } from "../utils/pagination";
import { hashPassword } from "../utils/password";
import {
  CreateUserInput,
  ListUsersQuery,
  UpdateUserInput,
} from "../validators/user.validator";

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  role: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

function mapUser(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  role: { id: string; name: UserRoleName };
}) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`,
    phone: user.phone,
    role: user.role.name,
    roleId: user.role.id,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

async function resolveRoleId(roleName: UserRoleName) {
  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) {
    throw new AppError("Role not found", 500);
  }
  return role.id;
}

export const userService = {
  async list(query: ListUsersQuery) {
    const { page, limit, skip } = parsePagination(query);
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.role ? { role: { name: query.role } } : {}),
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
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: userSelect,
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        skip,
        take: limit,
      }),
    ]);

    return {
      items: rows.map(mapUser),
      pagination: buildPaginationMeta(page, limit, total),
    };
  },

  async getById(id: string) {
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: userSelect,
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return mapUser(user);
  },

  async create(input: CreateUserInput, actorId: string) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });
    if (existing && !existing.deletedAt) {
      throw new AppError("Email already in use", 409);
    }

    const roleId = await resolveRoleId(input.role);
    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone ?? null,
        roleId,
      },
      select: userSelect,
    });

    await prisma.activityLog.create({
      data: {
        userId: actorId,
        action: ActivityAction.CREATE,
        entityType: "user",
        entityId: user.id,
        description: `Created employee ${user.firstName} ${user.lastName}`,
      },
    });

    return mapUser(user);
  },

  async update(id: string, input: UpdateUserInput, actorId: string) {
    const existing = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { role: true },
    });
    if (!existing) {
      throw new AppError("User not found", 404);
    }

    if (input.email && input.email.toLowerCase() !== existing.email) {
      const duplicate = await prisma.user.findFirst({
        where: {
          email: input.email.toLowerCase(),
          deletedAt: null,
          NOT: { id },
        },
      });
      if (duplicate) {
        throw new AppError("Email already in use", 409);
      }
    }

    if (input.isActive === false && id === actorId) {
      throw new AppError("You cannot deactivate your own account", 400);
    }

    const roleId =
      input.role !== undefined ? await resolveRoleId(input.role) : undefined;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(input.email !== undefined ? { email: input.email.toLowerCase() } : {}),
        ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
        ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...(roleId !== undefined ? { roleId } : {}),
        ...(input.password !== undefined
          ? { passwordHash: await hashPassword(input.password) }
          : {}),
      },
      select: userSelect,
    });

    await prisma.activityLog.create({
      data: {
        userId: actorId,
        action: ActivityAction.UPDATE,
        entityType: "user",
        entityId: id,
        description: `Updated employee ${user.firstName} ${user.lastName}`,
      },
    });

    return mapUser(user);
  },

  async remove(id: string, actorId: string) {
    if (id === actorId) {
      throw new AppError("You cannot archive your own account", 400);
    }

    const existing = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new AppError("User not found", 404);
    }

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false, refreshToken: null },
    });

    await prisma.activityLog.create({
      data: {
        userId: actorId,
        action: ActivityAction.DELETE,
        entityType: "user",
        entityId: id,
        description: `Archived employee ${existing.firstName} ${existing.lastName}`,
      },
    });
  },

  async listRoles() {
    const roles = await prisma.role.findMany({
      select: { id: true, name: true, description: true },
      orderBy: { name: "asc" },
    });
    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
    }));
  },
};
