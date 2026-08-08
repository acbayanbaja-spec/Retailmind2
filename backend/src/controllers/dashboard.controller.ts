import { Request, Response, NextFunction } from "express";
import { dashboardService } from "../services/dashboard.service";
import { sendSuccess } from "../utils/response";

export const dashboardController = {
  async overview(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.getOverview();
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },
};
