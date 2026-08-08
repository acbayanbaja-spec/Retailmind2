import { Router } from "express";
import { supplierController } from "../controllers/supplier.controller";
import { authenticate, requirePermission } from "../middleware/auth";
import { validateBody, validateQuery } from "../middleware/validate";
import {
  createSupplierSchema,
  listSuppliersQuerySchema,
  updateSupplierSchema,
} from "../validators/supplier.validator";

const router = Router();

router.use(authenticate);
router.use(requirePermission("products.manage"));

router.get("/", validateQuery(listSuppliersQuerySchema), supplierController.list);
router.get("/:id", supplierController.getById);
router.post("/", validateBody(createSupplierSchema), supplierController.create);
router.patch(
  "/:id",
  validateBody(updateSupplierSchema),
  supplierController.update
);
router.delete("/:id", supplierController.remove);

export default router;
