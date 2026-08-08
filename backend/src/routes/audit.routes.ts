import { Router } from "express";
import { auditController } from "../controllers/audit.controller";
import { authenticate, requirePermission } from "../middleware/auth";
import { validateQuery } from "../middleware/validate";
import { listAuditLogsQuerySchema } from "../validators/audit.validator";

const router = Router();

router.use(authenticate);
router.use(requirePermission("users.manage"));

router.get(
  "/",
  validateQuery(listAuditLogsQuerySchema),
  auditController.listActivityLogs
);

export default router;
