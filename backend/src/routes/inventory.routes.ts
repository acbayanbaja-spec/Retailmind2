import { Router } from "express";
import { inventoryController } from "../controllers/inventory.controller";
import { authenticate, requirePermission } from "../middleware/auth";
import { validateBody, validateQuery } from "../middleware/validate";
import {
  adjustInventorySchema,
  listInventoryQuerySchema,
  listTransactionsQuerySchema,
} from "../validators/inventory.validator";

const router = Router();

router.use(authenticate);

// Read-only endpoints - accessible to authenticated users
router.get(
  "/",
  validateQuery(listInventoryQuerySchema),
  inventoryController.list
);
router.get("/summary", inventoryController.summary);
router.get(
  "/transactions",
  validateQuery(listTransactionsQuerySchema),
  inventoryController.listTransactions
);

// Write endpoints - require inventory.manage permission
router.post(
  "/adjust",
  requirePermission("inventory.manage"),
  validateBody(adjustInventorySchema),
  inventoryController.adjust
);

export default router;
