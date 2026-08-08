import { Router } from "express";
import { settingController } from "../controllers/setting.controller";
import { authenticate, requirePermission } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import {
  bulkUpdateSettingsSchema,
  updateSettingSchema,
} from "../validators/setting.validator";

const router = Router();

router.use(authenticate);
router.use(requirePermission("settings.manage"));

router.get("/", settingController.list);
router.patch("/", validateBody(bulkUpdateSettingsSchema), settingController.bulkUpdate);
router.get("/:key", settingController.getByKey);
router.patch("/:key", validateBody(updateSettingSchema), settingController.update);

export default router;
