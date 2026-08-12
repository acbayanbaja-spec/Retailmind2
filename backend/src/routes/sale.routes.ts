import { Router } from "express";
import { saleController } from "../controllers/sale.controller";
import { authenticate, requirePermission } from "../middleware/auth";
import { validateBody, validateQuery } from "../middleware/validate";
import {
  createSaleSchema,
  listSalesQuerySchema,
  posProductSearchSchema,
} from "../validators/sale.validator";

const router = Router();

router.use(authenticate);

// Read-only endpoints - accessible to authenticated users with sales permissions
router.get(
  "/products",
  validateQuery(posProductSearchSchema),
  saleController.searchProducts
);
router.get("/", validateQuery(listSalesQuerySchema), saleController.list);
router.get("/:id", saleController.getById);

// Write endpoints - require sales.create permission
router.post("/", requirePermission("sales.create"), validateBody(createSaleSchema), saleController.create);

export default router;
