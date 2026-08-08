import prisma from "../lib/prisma";

const userWithRoleSelect = {
  id: true,
  email: true,
  passwordHash: true,
  firstName: true,
  lastName: true,
  phone: true,
  isActive: true,
  deletedAt: true,
  lastLoginAt: true,
  refreshToken: true,
  roleId: true,
  role: {
    select: {
      id: true,
      name: true,
      rolePermissions: {
        select: {
          permission: {
            select: { name: true },
          },
        },
      },
    },
  },
} as const;

export type UserWithRole = NonNullable<
  Awaited<ReturnType<typeof userRepository.findByEmail>>
>;

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: userWithRoleSelect,
    });
  },

  findByIdForAuth(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: userWithRoleSelect,
    });
  },

  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        deletedAt: true,
        lastLoginAt: true,
        roleId: true,
        role: {
          select: {
            id: true,
            name: true,
            rolePermissions: {
              select: {
                permission: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });
  },

  updateRefreshToken(userId: string, refreshToken: string | null) {
    return prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });
  },

  updateLastLogin(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  },

  updatePassword(userId: string, passwordHash: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });
  },

  setPasswordResetToken(userId: string, token: string, expires: Date) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        passwordResetToken: token,
        passwordResetExpires: expires,
      },
    });
  },

  findByPasswordResetToken(token: string) {
    return prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
        isActive: true,
        deletedAt: null,
      },
      select: userWithRoleSelect,
    });
  },
};
