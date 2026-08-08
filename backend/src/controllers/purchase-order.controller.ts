import { Request, Response, NextFunction } from "express";
import { purchaseOrderService } from "../services/purchase-order.service";
import { sendPaginated, sendSuccess } from "../utils/response";
import { purchaseOrderIdParamSchema } from "../validators/purchase-order.validator";

export const purchaseOrderController = {
  async listProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const products = await purchaseOrderService.listProducts(req.query as never);
      sendSuccess(res, products);
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await purchaseOrderService.list(req.query as never);
      sendPaginated(res, result.items, result.pagination);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = purchaseOrderIdParamSchema.parse(req.params);
      const po = await purchaseOrderService.getById(id);
      sendSuccess(res, po);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const po = await purchaseOrderService.create(req.body, req.user!.userId);
      sendSuccess(res, po, "Purchase order created", 201);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = purchaseOrderIdParamSchema.parse(req.params);
      const po = await purchaseOrderService.update(id, req.body, req.user!.userId);
      sendSuccess(res, po, "Purchase order updated");
    } catch (err) {
      next(err);
    }
  },

  async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = purchaseOrderIdParamSchema.parse(req.params);
      const po = await purchaseOrderService.submit(id, req.user!.userId);
      sendSuccess(res, po, "Purchase order submitted");
    } catch (err) {
      next(err);
    }
  },

  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = purchaseOrderIdParamSchema.parse(req.params);
      const po = await purchaseOrderService.approve(id, req.user!.userId);
      sendSuccess(res, po, "Purchase order approved");
    } catch (err) {
      next(err);
    }
  },

  async markOrdered(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = purchaseOrderIdParamSchema.parse(req.params);
      const po = await purchaseOrderService.markOrdered(id, req.user!.userId);
      sendSuccess(res, po, "Purchase order marked as ordered");
    } catch (err) {
      next(err);
    }
  },

  async receive(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = purchaseOrderIdParamSchema.parse(req.params);
      const po = await purchaseOrderService.receive(id, req.body, req.user!.userId);
      sendSuccess(res, po, "Goods received");
    } catch (err) {
      next(err);
    }
  },

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = purchaseOrderIdParamSchema.parse(req.params);
      const po = await purchaseOrderService.cancel(id, req.user!.userId);
      sendSuccess(res, po, "Purchase order cancelled");
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = purchaseOrderIdParamSchema.parse(req.params);
      await purchaseOrderService.remove(id, req.user!.userId);
      sendSuccess(res, undefined, "Purchase order archived");
    } catch (err) {
      next(err);
    }
  },
};
