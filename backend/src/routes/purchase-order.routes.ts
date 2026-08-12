import { Router } from "express";
import { purchaseOrderController } from "../controllers/purchase-order.controller";
import { authenticate, requirePermission } from "../middleware/auth";
import { validateBody, validateQuery } from "../middleware/validate";
import {
  createPurchaseOrderSchema,
  listPurchaseOrdersQuerySchema,
  poProductsQuerySchema,
  receivePurchaseOrderSchema,
  updatePurchaseOrderSchema,
} from "../validators/purchase-order.validator";

const router = Router();

// Public read-only endpoints for purchase order visibility
router.get(
  "/products",
  validateQuery(poProductsQuerySchema),
  purchaseOrderController.listProducts
);
router.get(
  "/",
  validateQuery(listPurchaseOrdersQuerySchema),
  purchaseOrderController.list
);
router.get("/:id", purchaseOrderController.getById);

// All other endpoints require authentication
router.use(authenticate);

// Write endpoints - require purchase_orders.manage permission
router.post(
  "/",
  requirePermission("purchase_orders.manage"),
  validateBody(createPurchaseOrderSchema),
  purchaseOrderController.create
);
router.patch(
  "/:id",
  requirePermission("purchase_orders.manage"),
  validateBody(updatePurchaseOrderSchema),
  purchaseOrderController.update
);
router.post("/:id/submit", requirePermission("purchase_orders.manage"), purchaseOrderController.submit);
router.post("/:id/approve", requirePermission("purchase_orders.manage"), purchaseOrderController.approve);
router.post("/:id/order", requirePermission("purchase_orders.manage"), purchaseOrderController.markOrdered);
router.post(
  "/:id/receive",
  requirePermission("purchase_orders.manage"),
  validateBody(receivePurchaseOrderSchema),
  purchaseOrderController.receive
);
router.post("/:id/cancel", requirePermission("purchase_orders.manage"), purchaseOrderController.cancel);
router.delete("/:id", requirePermission("purchase_orders.manage"), purchaseOrderController.remove);

export default router;
