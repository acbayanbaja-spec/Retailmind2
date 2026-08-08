import { Request, Response, NextFunction } from "express";
import { UserRoleName } from "@prisma/client";
import { AppError } from "./errorHandler";
import { authService } from "../services/auth.service";
import { verifyAccessToken } from "../utils/jwt";
import { UserRole } from "../types";

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(new AppError("Authentication required", 401));
    return;
  }

  const token = header.slice(7);
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(new AppError("Invalid or expired access token", 401));
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError("Authentication required", 401));
      return;
    }

    if (!roles.includes(req.user.roleName as UserRole)) {
      next(new AppError("Insufficient permissions", 403));
      return;
    }

    next();
  };
}

export function requirePermission(...permissions: string[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      next(new AppError("Authentication required", 401));
      return;
    }

    try {
      const user = await authService.getMe(req.user.userId);
      if (!authService.hasPermission(user.permissions, permissions)) {
        next(new AppError("Insufficient permissions", 403));
        return;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function authorizeRoles(...roles: UserRoleName[]) {
  return authorize(...(roles as UserRole[]));
}
