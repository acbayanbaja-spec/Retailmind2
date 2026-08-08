import crypto from "crypto";
import { ActivityAction, UserRoleName } from "@prisma/client";
import prisma from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { userRepository, UserWithRole } from "../repositories/user.repository";
import { JwtPayload, UserRole } from "../types";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { comparePassword, hashPassword } from "../utils/password";
import {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  ResetPasswordInput,
} from "../validators/auth.validator";

export interface AuthUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRole;
  permissions: string[];
  lastLoginAt: string | null;
}

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
}

function extractPermissions(user: UserWithRole): string[] {
  return user.role.rolePermissions.map((rp) => rp.permission.name);
}

function toAuthUser(user: UserWithRole): AuthUserResponse {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    role: user.role.name as UserRole,
    permissions: extractPermissions(user),
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
  };
}

function buildJwtPayload(user: UserWithRole): JwtPayload {
  return {
    userId: user.id,
    email: user.email,
    roleId: user.roleId,
    roleName: user.role.name,
  };
}

function assertActiveUser(user: UserWithRole | null): UserWithRole {
  if (!user || user.deletedAt) {
    throw new AppError("Invalid email or password", 401);
  }
  if (!user.isActive) {
    throw new AppError("Your account has been deactivated", 403);
  }
  return user;
}

async function logActivity(
  userId: string,
  action: ActivityAction,
  description: string,
  ipAddress?: string
) {
  await prisma.activityLog.create({
    data: {
      userId,
      action,
      entityType: "user",
      entityId: userId,
      description,
      ipAddress,
    },
  });
}

export const authService = {
  async login(
    input: LoginInput,
    ipAddress?: string
  ): Promise<{ user: AuthUserResponse; tokens: AuthTokensResponse }> {
    const user = assertActiveUser(
      await userRepository.findByEmail(input.email)
    );

    const valid = await comparePassword(input.password, user.passwordHash);
    if (!valid) {
      throw new AppError("Invalid email or password", 401);
    }

    const payload = buildJwtPayload(user);
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken({ userId: user.id });

    await userRepository.updateRefreshToken(user.id, refreshToken);
    await userRepository.updateLastLogin(user.id);
    await logActivity(user.id, ActivityAction.LOGIN, "User logged in", ipAddress);

    return {
      user: toAuthUser(user),
      tokens: { accessToken, refreshToken },
    };
  },

  async refresh(refreshToken: string): Promise<AuthTokensResponse> {
    let decoded: { userId: string };
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    const user = assertActiveUser(
      await userRepository.findByIdForAuth(decoded.userId)
    );
    if (user.refreshToken !== refreshToken) {
      if (user.refreshToken) {
        await userRepository.updateRefreshToken(user.id, null);
        await logActivity(
          user.id,
          ActivityAction.LOGOUT,
          "Refresh token reuse detected — all sessions invalidated"
        );
      }
      throw new AppError("Invalid or expired refresh token", 401);
    }

    const payload = buildJwtPayload(user);
    const newAccessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken({ userId: user.id });

    await userRepository.updateRefreshToken(user.id, newRefreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  },

  async logout(userId: string, ipAddress?: string): Promise<void> {
    await userRepository.updateRefreshToken(userId, null);
    await logActivity(userId, ActivityAction.LOGOUT, "User logged out", ipAddress);
  },

  async getMe(userId: string): Promise<AuthUserResponse> {
    const user = await userRepository.findById(userId);
    if (!user || user.deletedAt || !user.isActive) {
      throw new AppError("User not found", 404);
    }
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role.name as UserRole,
      permissions: user.role.rolePermissions.map((rp) => rp.permission.name),
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    };
  },

  async changePassword(
    userId: string,
    input: ChangePasswordInput
  ): Promise<void> {
    const user = await userRepository.findByIdForAuth(userId);
    if (!user || user.deletedAt || !user.isActive) {
      throw new AppError("User not found", 404);
    }

    const valid = await comparePassword(input.currentPassword, user.passwordHash);
    if (!valid) {
      throw new AppError("Current password is incorrect", 400);
    }

    const passwordHash = await hashPassword(input.newPassword);
    await userRepository.updatePassword(userId, passwordHash);
    await userRepository.updateRefreshToken(userId, null);
    await logActivity(
      userId,
      ActivityAction.UPDATE,
      "Password changed — all sessions invalidated"
    );
  },

  async forgotPassword(input: ForgotPasswordInput): Promise<void> {
    const user = await userRepository.findByEmail(input.email);
    if (!user || user.deletedAt || !user.isActive) {
      // Do not reveal whether the email exists
      return;
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await userRepository.setPasswordResetToken(user.id, token, expires);

    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV] Password reset token for ${user.email}: ${token}`);
    }
  },

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const user = await userRepository.findByPasswordResetToken(input.token);
    if (!user) {
      throw new AppError("Invalid or expired reset token", 400);
    }

    const passwordHash = await hashPassword(input.newPassword);
    await userRepository.updatePassword(user.id, passwordHash);
    await userRepository.updateRefreshToken(user.id, null);
    await logActivity(user.id, ActivityAction.UPDATE, "Password reset completed");
  },

  hasRole(userRole: UserRoleName, allowedRoles: UserRoleName[]): boolean {
    return allowedRoles.includes(userRole);
  },

  hasPermission(userPermissions: string[], required: string | string[]): boolean {
    const requiredList = Array.isArray(required) ? required : [required];
    return requiredList.some((p) => userPermissions.includes(p));
  },
};
