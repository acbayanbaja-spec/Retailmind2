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

// Public read-only endpoints for supplier catalog
router.get("/", validateQuery(listSuppliersQuerySchema), supplierController.list);
router.get("/:id", supplierController.getById);

// All other endpoints require authentication
router.use(authenticate);

// Write endpoints - require products.manage permission
router.post("/", requirePermission("products.manage"), validateBody(createSupplierSchema), supplierController.create);
router.patch(
  "/:id",
  requirePermission("products.manage"),
  validateBody(updateSupplierSchema),
  supplierController.update
);
router.delete("/:id", requirePermission("products.manage"), supplierController.remove);

export default router;
