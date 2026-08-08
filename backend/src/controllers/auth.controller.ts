import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";
import { sendSuccess } from "../utils/response";

function getClientIp(req: Request): string | undefined {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
    req.socket.remoteAddress
  );
}

export const authController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body, getClientIp(req));
      sendSuccess(res, result, "Login successful");
    } catch (err) {
      next(err);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const tokens = await authService.refresh(req.body.refreshToken);
      sendSuccess(res, { tokens }, "Token refreshed");
    } catch (err) {
      next(err);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user) {
        await authService.logout(req.user.userId, getClientIp(req));
      }
      sendSuccess(res, undefined, "Logged out successfully");
    } catch (err) {
      next(err);
    }
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.getMe(req.user!.userId);
      sendSuccess(res, { user });
    } catch (err) {
      next(err);
    }
  },

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.changePassword(req.user!.userId, req.body);
      sendSuccess(res, undefined, "Password updated successfully");
    } catch (err) {
      next(err);
    }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.forgotPassword(req.body);
      sendSuccess(
        res,
        undefined,
        "If an account exists with that email, a reset link has been sent"
      );
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.resetPassword(req.body);
      sendSuccess(res, undefined, "Password reset successfully");
    } catch (err) {
      next(err);
    }
  },
};
