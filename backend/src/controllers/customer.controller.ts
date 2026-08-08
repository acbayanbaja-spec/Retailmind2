import { Request, Response, NextFunction } from "express";
import { customerService } from "../services/customer.service";
import { sendPaginated, sendSuccess } from "../utils/response";
import { customerIdParamSchema } from "../validators/customer.validator";

export const customerController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await customerService.list(req.query as never);
      sendPaginated(res, result.items, result.pagination);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = customerIdParamSchema.parse(req.params);
      const customer = await customerService.getById(id);
      sendSuccess(res, customer);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await customerService.create(req.body, req.user!.userId);
      sendSuccess(res, customer, "Customer created", 201);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = customerIdParamSchema.parse(req.params);
      const customer = await customerService.update(id, req.body, req.user!.userId);
      sendSuccess(res, customer, "Customer updated");
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = customerIdParamSchema.parse(req.params);
      await customerService.remove(id, req.user!.userId);
      sendSuccess(res, undefined, "Customer archived");
    } catch (err) {
      next(err);
    }
  },
};
