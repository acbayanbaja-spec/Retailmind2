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

router.use(authenticate);
router.use(requirePermission("products.manage"));

router.get(
  "/",
  validateQuery(listProductsQuerySchema),
  productController.list
);
router.get("/meta/categories", productController.listCategories);
router.get("/meta/brands", productController.listBrands);
router.get("/meta/suppliers", productController.listSuppliers);
router.get("/:id", productController.getById);
router.post("/", validateBody(createProductSchema), productController.create);
router.patch(
  "/:id",
  validateBody(updateProductSchema),
  productController.update
);
router.delete("/:id", productController.remove);

export default router;
