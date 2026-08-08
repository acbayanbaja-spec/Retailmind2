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

router.use(authenticate);
router.use(requirePermission("expenses.manage"));

router.get(
  "/categories",
  validateQuery(listExpenseCategoriesQuerySchema),
  expenseController.listCategories
);
router.post(
  "/categories",
  validateBody(createExpenseCategorySchema),
  expenseController.createCategory
);
router.patch(
  "/categories/:id",
  validateBody(updateExpenseCategorySchema),
  expenseController.updateCategory
);
router.delete("/categories/:id", expenseController.removeCategory);

router.get("/summary", expenseController.getSummary);
router.get("/", validateQuery(listExpensesQuerySchema), expenseController.list);
router.get("/:id", expenseController.getById);
router.post("/", validateBody(createExpenseSchema), expenseController.create);
router.patch(
  "/:id",
  validateBody(updateExpenseSchema),
  expenseController.update
);
router.delete("/:id", expenseController.remove);

export default router;
