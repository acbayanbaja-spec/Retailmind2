import { Request, Response, NextFunction } from "express";
import { settingService } from "../services/setting.service";
import { sendSuccess } from "../utils/response";
import { settingKeyParamSchema } from "../validators/setting.validator";

export const settingController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await settingService.list();
      sendSuccess(res, settings);
    } catch (err) {
      next(err);
    }
  },

  async getByKey(req: Request, res: Response, next: NextFunction) {
    try {
      const { key } = settingKeyParamSchema.parse(req.params);
      const setting = await settingService.getByKey(key);
      sendSuccess(res, setting);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { key } = settingKeyParamSchema.parse(req.params);
      const setting = await settingService.update(key, req.body, req.user!.userId);
      sendSuccess(res, setting, "Setting updated");
    } catch (err) {
      next(err);
    }
  },

  async bulkUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await settingService.bulkUpdate(req.body, req.user!.userId);
      sendSuccess(res, settings, "Settings updated");
    } catch (err) {
      next(err);
    }
  },
};
