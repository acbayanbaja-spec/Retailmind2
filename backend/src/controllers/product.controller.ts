import { Request, Response, NextFunction } from "express";
import { productService } from "../services/product.service";
import { sendPaginated, sendSuccess } from "../utils/response";
import { productIdParamSchema } from "../validators/product.validator";

export const productController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await productService.list(req.query as any);
      sendPaginated(res, result.items, result.pagination);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = productIdParamSchema.parse(req.params);
      const product = await productService.getById(id);
      sendSuccess(res, product);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.create(req.body, req.user!.userId);
      sendSuccess(res, product, "Product created", 201);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = productIdParamSchema.parse(req.params);
      const product = await productService.update(id, req.body, req.user!.userId);
      sendSuccess(res, product, "Product updated");
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = productIdParamSchema.parse(req.params);
      await productService.remove(id, req.user!.userId);
      sendSuccess(res, undefined, "Product archived");
    } catch (err) {
      next(err);
    }
  },

  async listCategories(_req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await productService.listCategories();
      sendSuccess(res, categories);
    } catch (err) {
      next(err);
    }
  },

  async listBrands(_req: Request, res: Response, next: NextFunction) {
    try {
      const brands = await productService.listBrands();
      sendSuccess(res, brands);
    } catch (err) {
      next(err);
    }
  },

  async listSuppliers(_req: Request, res: Response, next: NextFunction) {
    try {
      const suppliers = await productService.listSuppliers();
      sendSuccess(res, suppliers);
    } catch (err) {
      next(err);
    }
  },
};
