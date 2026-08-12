import { Router } from "express";
import { customerController } from "../controllers/customer.controller";
import { authenticate, requirePermission } from "../middleware/auth";
import { validateBody, validateQuery } from "../middleware/validate";
import {
  createCustomerSchema,
  listCustomersQuerySchema,
  updateCustomerSchema,
} from "../validators/customer.validator";

const router = Router();

// Public read-only endpoints for customer catalog
router.get("/", validateQuery(listCustomersQuerySchema), customerController.list);
router.get("/:id", customerController.getById);

// All other endpoints require authentication and permissions
router.use(authenticate);
router.use(requirePermission("customers.manage"));

router.post("/", validateBody(createCustomerSchema), customerController.create);
router.patch(
  "/:id",
  validateBody(updateCustomerSchema),
  customerController.update
);
router.delete("/:id", customerController.remove);

export default router;
