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

router.use(authenticate);
router.use(requirePermission("purchase_orders.manage"));

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
router.post(
  "/",
  validateBody(createPurchaseOrderSchema),
  purchaseOrderController.create
);
router.patch(
  "/:id",
  validateBody(updatePurchaseOrderSchema),
  purchaseOrderController.update
);
router.post("/:id/submit", purchaseOrderController.submit);
router.post("/:id/approve", purchaseOrderController.approve);
router.post("/:id/order", purchaseOrderController.markOrdered);
router.post(
  "/:id/receive",
  validateBody(receivePurchaseOrderSchema),
  purchaseOrderController.receive
);
router.post("/:id/cancel", purchaseOrderController.cancel);
router.delete("/:id", purchaseOrderController.remove);

export default router;
