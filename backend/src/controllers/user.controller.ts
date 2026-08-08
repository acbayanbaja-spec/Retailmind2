import { Request, Response, NextFunction } from "express";
import { userService } from "../services/user.service";
import { sendPaginated, sendSuccess } from "../utils/response";
import { userIdParamSchema } from "../validators/user.validator";

export const userController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await userService.list(req.query as never);
      sendPaginated(res, result.items, result.pagination);
    } catch (err) {
      next(err);
    }
  },

  async listRoles(_req: Request, res: Response, next: NextFunction) {
    try {
      const roles = await userService.listRoles();
      sendSuccess(res, roles);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = userIdParamSchema.parse(req.params);
      const user = await userService.getById(id);
      sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.create(req.body, req.user!.userId);
      sendSuccess(res, user, "Employee created", 201);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = userIdParamSchema.parse(req.params);
      const user = await userService.update(id, req.body, req.user!.userId);
      sendSuccess(res, user, "Employee updated");
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = userIdParamSchema.parse(req.params);
      await userService.remove(id, req.user!.userId);
      sendSuccess(res, undefined, "Employee archived");
    } catch (err) {
      next(err);
    }
  },
};
