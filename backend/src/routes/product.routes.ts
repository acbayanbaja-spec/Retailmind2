import { Router } from "express";
import { productController } from "../controllers/product.controller";
import { authenticate, requirePermission } from "../middleware/auth";
import { validateBody, validateQuery } from "../middleware/validate";
import {
  createProductSchema,
  listProductsQuerySchema,
  updateProductSchema,
} from "../validators/product.validator";

const router = Router();

// Public read-only endpoints for product catalog
router.get("/", productController.list);
router.get("/meta/categories", productController.listCategories);
router.get("/meta/brands", productController.listBrands);
router.get("/meta/suppliers", productController.listSuppliers);
router.get("/:id", productController.getById);

// All other endpoints require authentication
router.use(authenticate);

// Write endpoints - require products.manage permission
router.post("/", requirePermission("products.manage"), validateBody(createProductSchema), productController.create);
router.patch(
  "/:id",
  requirePermission("products.manage"),
  validateBody(updateProductSchema),
  productController.update
);
router.delete("/:id", requirePermission("products.manage"), productController.remove);

export default router;
