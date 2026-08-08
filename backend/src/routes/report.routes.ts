import { Router } from "express";
import { reportController } from "../controllers/report.controller";
import { authenticate, requirePermission } from "../middleware/auth";
import { validateQuery } from "../middleware/validate";
import { reportQuerySchema } from "../validators/report.validator";

const router = Router();

router.use(authenticate);
router.use(requirePermission("reports.view"));

router.get(
  "/business",
  validateQuery(reportQuerySchema),
  reportController.getBusinessReport
);

export default router;
