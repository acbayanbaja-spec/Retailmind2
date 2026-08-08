import { Request, Response, NextFunction } from "express";
import { reportService } from "../services/report.service";
import { sendSuccess } from "../utils/response";
import { reportQuerySchema } from "../validators/report.validator";

export const reportController = {
  async getBusinessReport(req: Request, res: Response, next: NextFunction) {
    try {
      const query = reportQuerySchema.parse(req.query);
      const report = await reportService.getBusinessReport(query);
      sendSuccess(res, report);
    } catch (err) {
      next(err);
    }
  },
};
