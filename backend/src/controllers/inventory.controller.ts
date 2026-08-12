import { Request, Response, NextFunction } from "express";
import { inventoryService } from "../services/inventory.service";
import { sendPaginated, sendSuccess } from "../utils/response";

export const inventoryController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await inventoryService.list(req.query as any);
      sendPaginated(res, result.items, result.pagination);
    } catch (err) {
      next(err);
    }
  },

  async summary(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await inventoryService.summary();
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async listTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await inventoryService.listTransactions(req.query as any);
      sendPaginated(res, result.items, result.pagination);
    } catch (err) {
      next(err);
    }
  },

  async adjust(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await inventoryService.adjust(req.body, req.user!.userId);
      sendSuccess(res, result, "Inventory updated");
    } catch (err) {
      next(err);
    }
  },
};
