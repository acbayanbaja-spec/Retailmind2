import { Request, Response, NextFunction } from "express";
import { auditService } from "../services/audit.service";
import { sendSuccess } from "../utils/response";
import { listAuditLogsQuerySchema } from "../validators/audit.validator";

export const auditController = {
  async listActivityLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const query = listAuditLogsQuerySchema.parse(req.query);
      const result = await auditService.listActivityLogs(query);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },
};
