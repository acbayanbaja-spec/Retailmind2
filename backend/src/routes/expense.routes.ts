import { Router } from "express";
import { expenseController } from "../controllers/expense.controller";
import { authenticate, requirePermission } from "../middleware/auth";
import { validateBody, validateQuery } from "../middleware/validate";
import {
  createExpenseCategorySchema,
  createExpenseSchema,
  listExpenseCategoriesQuerySchema,
  listExpensesQuerySchema,
  updateExpenseCategorySchema,
  updateExpenseSchema,
} from "../validators/expense.validator";

const router = Router();

// Public read-only endpoints for expense visibility
router.get(
  "/categories",
  validateQuery(listExpenseCategoriesQuerySchema),
  expenseController.listCategories
);
router.get("/summary", expenseController.getSummary);
router.get("/", validateQuery(listExpensesQuerySchema), expenseController.list);
router.get("/:id", expenseController.getById);

// All other endpoints require authentication
router.use(authenticate);

// Write endpoints - require expenses.manage permission
router.post(
  "/categories",
  requirePermission("expenses.manage"),
  validateBody(createExpenseCategorySchema),
  expenseController.createCategory
);
router.patch(
  "/categories/:id",
  requirePermission("expenses.manage"),
  validateBody(updateExpenseCategorySchema),
  expenseController.updateCategory
);
router.delete("/categories/:id", requirePermission("expenses.manage"), expenseController.removeCategory);

router.post("/", requirePermission("expenses.manage"), validateBody(createExpenseSchema), expenseController.create);
router.patch(
  "/:id",
  requirePermission("expenses.manage"),
  validateBody(updateExpenseSchema),
  expenseController.update
);
router.delete("/:id", requirePermission("expenses.manage"), expenseController.remove);

export default router;
