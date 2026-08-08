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
router.use(requirePermission("inventory.manage"));

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
router.post(
  "/adjust",
  validateBody(adjustInventorySchema),
  inventoryController.adjust
);

export default router;
