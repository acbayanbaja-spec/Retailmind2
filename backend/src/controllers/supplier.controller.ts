import { Request, Response, NextFunction } from "express";
import { supplierService } from "../services/supplier.service";
import { sendPaginated, sendSuccess } from "../utils/response";
import { supplierIdParamSchema } from "../validators/supplier.validator";

export const supplierController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await supplierService.list(req.query as never);
      sendPaginated(res, result.items, result.pagination);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = supplierIdParamSchema.parse(req.params);
      const supplier = await supplierService.getById(id);
      sendSuccess(res, supplier);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const supplier = await supplierService.create(req.body, req.user!.userId);
      sendSuccess(res, supplier, "Supplier created", 201);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = supplierIdParamSchema.parse(req.params);
      const supplier = await supplierService.update(id, req.body, req.user!.userId);
      sendSuccess(res, supplier, "Supplier updated");
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = supplierIdParamSchema.parse(req.params);
      await supplierService.remove(id, req.user!.userId);
      sendSuccess(res, undefined, "Supplier archived");
    } catch (err) {
      next(err);
    }
  },
};
