import { Request, Response, NextFunction } from "express";
import { expenseService } from "../services/expense.service";
import { sendPaginated, sendSuccess } from "../utils/response";
import {
  createExpenseCategorySchema,
  createExpenseSchema,
  expenseCategoryIdParamSchema,
  expenseIdParamSchema,
  expenseSummaryQuerySchema,
  listExpenseCategoriesQuerySchema,
  listExpensesQuerySchema,
  updateExpenseCategorySchema,
  updateExpenseSchema,
} from "../validators/expense.validator";

export const expenseController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await expenseService.list(req.query as never);
      sendPaginated(res, result.items, result.pagination);
    } catch (err) {
      next(err);
    }
  },

  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const query = expenseSummaryQuerySchema.parse(req.query);
      const summary = await expenseService.getSummary(query);
      sendSuccess(res, summary);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = expenseIdParamSchema.parse(req.params);
      const expense = await expenseService.getById(id);
      sendSuccess(res, expense);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const expense = await expenseService.create(req.body, req.user!.userId);
      sendSuccess(res, expense, "Expense recorded", 201);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = expenseIdParamSchema.parse(req.params);
      const expense = await expenseService.update(id, req.body, req.user!.userId);
      sendSuccess(res, expense, "Expense updated");
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = expenseIdParamSchema.parse(req.params);
      await expenseService.remove(id, req.user!.userId);
      sendSuccess(res, undefined, "Expense archived");
    } catch (err) {
      next(err);
    }
  },

  async listCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const query = listExpenseCategoriesQuerySchema.parse(req.query);
      const categories = await expenseService.listCategories(query);
      sendSuccess(res, categories);
    } catch (err) {
      next(err);
    }
  },

  async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await expenseService.createCategory(
        req.body,
        req.user!.userId
      );
      sendSuccess(res, category, "Category created", 201);
    } catch (err) {
      next(err);
    }
  },

  async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = expenseCategoryIdParamSchema.parse(req.params);
      const category = await expenseService.updateCategory(
        id,
        req.body,
        req.user!.userId
      );
      sendSuccess(res, category, "Category updated");
    } catch (err) {
      next(err);
    }
  },

  async removeCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = expenseCategoryIdParamSchema.parse(req.params);
      await expenseService.removeCategory(id, req.user!.userId);
      sendSuccess(res, undefined, "Category archived");
    } catch (err) {
      next(err);
    }
  },
};
