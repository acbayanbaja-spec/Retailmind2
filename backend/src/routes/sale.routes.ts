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
router.use(requirePermission("sales.create"));

router.get(
  "/products",
  validateQuery(posProductSearchSchema),
  saleController.searchProducts
);
router.get("/", validateQuery(listSalesQuerySchema), saleController.list);
router.get("/:id", saleController.getById);
router.post("/", validateBody(createSaleSchema), saleController.create);

export default router;
