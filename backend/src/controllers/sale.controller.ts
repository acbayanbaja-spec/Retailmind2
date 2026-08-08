import { Request, Response, NextFunction } from "express";
import { saleService } from "../services/sale.service";
import { sendPaginated, sendSuccess } from "../utils/response";
import { saleIdParamSchema } from "../validators/sale.validator";

export const saleController = {
  async searchProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const products = await saleService.searchProducts(req.query as never);
      sendSuccess(res, products);
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await saleService.list(req.query as never);
      sendPaginated(res, result.items, result.pagination);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = saleIdParamSchema.parse(req.params);
      const sale = await saleService.getById(id);
      sendSuccess(res, sale);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const sale = await saleService.create(req.body, req.user!.userId);
      sendSuccess(res, sale, "Sale completed", 201);
    } catch (err) {
      next(err);
    }
  },
};
