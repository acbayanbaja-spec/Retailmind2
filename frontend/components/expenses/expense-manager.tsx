"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FolderOpen, Plus, Receipt, Search } from "lucide-react";
import { ExpenseCategoryDialog } from "@/components/expenses/expense-category-dialog";
import { ExpenseFormDialog } from "@/components/expenses/expense-form-dialog";
import { Pagination, SelectField, StatusBadge } from "@/components/shared/table-utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useExpenseCategories,
  useExpenseList,
  useExpenseMutations,
  useExpenseSummary,
} from "@/hooks/use-expenses";
import { ApiError } from "@/lib/api-client";
import { formatCurrency, formatShortDate } from "@/lib/format";
import {
  ExpenseCategoryFormValues,
  ExpenseFormValues,
} from "@/schemas/expense.schema";
import { Expense, ExpenseCategory, ExpenseRecurrence } from "@/types";

const RECURRENCE_OPTIONS: { value: ExpenseRecurrence | ""; label: string }[] = [
  { value: "", label: "All recurrence" },
  { value: "NONE", label: "One-time" },
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY", label: "Yearly" },
];

function currentMonthInput(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function toExpensePayload(values: ExpenseFormValues) {
  return {
    categoryId: values.categoryId,
    title: values.title,
    amount: values.amount,
    description: values.description?.trim() || null,
    expenseDate: values.expenseDate,
    recurrence: values.recurrence,
  };
}

function toCategoryPayload(values: ExpenseCategoryFormValues, isEdit: boolean) {
  return {
    name: values.name,
    description: values.description?.trim() || null,
    ...(isEdit && values.isActive !== undefined
      ? { isActive: values.isActive === "true" }
      : {}),
  };
}

function formatRecurrence(value: ExpenseRecurrence): string {
  if (value === "NONE") return "One-time";
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export function ExpenseManager() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [recurrenceFilter, setRecurrenceFilter] = useState<ExpenseRecurrence | "">("");
  const [monthFilter, setMonthFilter] = useState(currentMonthInput());
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoriesPanelOpen, setCategoriesPanelOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);

  const dateFrom = `${monthFilter}-01`;
  const [year, month] = monthFilter.split("-").map(Number);
  const dateTo = `${monthFilter}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`;

  const params = useMemo(
    () => ({
      page,
      limit: 15,
      search: search || undefined,
      categoryId: categoryFilter || undefined,
      recurrence: recurrenceFilter || undefined,
      dateFrom,
      dateTo,
    }),
    [page, search, categoryFilter, recurrenceFilter, dateFrom, dateTo]
  );

  const { data, isLoading, isError, refetch } = useExpenseList(params);
  const { data: summary, isLoading: summaryLoading } = useExpenseSummary(monthFilter);
  const { data: categories = [] } = useExpenseCategories();
  const { data: activeCategories = [] } = useExpenseCategories(true);
  const mutations = useExpenseMutations();

  function openCreateExpense() {
    setEditingExpense(null);
    setExpenseDialogOpen(true);
  }

  function openEditExpense(expense: Expense) {
    setEditingExpense(expense);
    setExpenseDialogOpen(true);
  }

  function openCreateCategory() {
    setEditingCategory(null);
    setCategoryDialogOpen(true);
  }

  function openEditCategory(category: ExpenseCategory) {
    setEditingCategory(category);
    setCategoryDialogOpen(true);
  }

  async function handleExpenseSubmit(values: ExpenseFormValues) {
    try {
      const payload = toExpensePayload(values);
      if (editingExpense) {
        await mutations.update.mutateAsync({ id: editingExpense.id, payload });
        toast.success("Expense updated");
      } else {
        await mutations.create.mutateAsync(payload);
        toast.success("Expense recorded");
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Request failed");
      throw err;
    }
  }

  async function handleCategorySubmit(values: ExpenseCategoryFormValues) {
    try {
      const payload = toCategoryPayload(values, !!editingCategory);
      if (editingCategory) {
        await mutations.updateCategory.mutateAsync({
          id: editingCategory.id,
          payload,
        });
        toast.success("Category updated");
      } else {
        await mutations.createCategory.mutateAsync(payload);
        toast.success("Category created");
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Request failed");
      throw err;
    }
  }

  async function handleArchiveExpense(expense: Expense) {
    if (!confirm(`Archive "${expense.title}"?`)) return;
    try {
      await mutations.archive.mutateAsync(expense.id);
      toast.success("Expense archived");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Archive failed");
    }
  }

  async function handleArchiveCategory(category: ExpenseCategory) {
    if (!confirm(`Archive category "${category.name}"?`)) return;
    try {
      await mutations.archiveCategory.mutateAsync(category.id);
      toast.success("Category archived");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Archive failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Expense tracker</h2>
          <p className="text-sm text-muted-foreground">
            Record costs, track recurring bills, and monitor monthly spend.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setCategoriesPanelOpen((v) => !v)}>
            <FolderOpen className="mr-2 h-4 w-4" />
            Categories
          </Button>
          <Button onClick={openCreateExpense}>
            <Plus className="mr-2 h-4 w-4" />
            Record expense
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Month total</p>
          {summaryLoading ? (
            <Skeleton className="mt-2 h-8 w-32" />
          ) : (
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {formatCurrency(summary?.totalAmount ?? 0)}
            </p>
          )}
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Expenses this month</p>
          {summaryLoading ? (
            <Skeleton className="mt-2 h-8 w-16" />
          ) : (
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {summary?.expenseCount ?? 0}
            </p>
          )}
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Recurring items</p>
          {summaryLoading ? (
            <Skeleton className="mt-2 h-8 w-16" />
          ) : (
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {summary?.recurringCount ?? 0}
            </p>
          )}
        </Card>
      </div>

      {categoriesPanelOpen ? (
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-foreground">Expense categories</h3>
              <p className="text-sm text-muted-foreground">
                Organize expenses by type (rent, utilities, salaries, etc.).
              </p>
            </div>
            <Button variant="secondary" onClick={openCreateCategory}>
              <Plus className="mr-2 h-4 w-4" />
              Add category
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Category</th>
                  <th className="pb-3 pr-4 font-medium">Expenses</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id} className="border-b border-border/60">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-foreground">{category.name}</p>
                      {category.description ? (
                        <p className="text-xs text-muted-foreground">{category.description}</p>
                      ) : null}
                    </td>
                    <td className="py-3 pr-4">{category.expenseCount}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={category.isActive ? "ACTIVE" : "INACTIVE"} />
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditCategory(category)}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleArchiveCategory(category)}
                          className="text-sm font-medium text-danger hover:underline"
                        >
                          Archive
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      <Card className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-4">
          <form
            className="flex gap-2 lg:col-span-2"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setSearch(searchInput.trim());
            }}
          >
            <Input
              placeholder="Search title or category..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <Button type="submit" variant="secondary">
              <Search className="h-4 w-4" />
            </Button>
          </form>

          <Input
            label="Month"
            type="month"
            value={monthFilter}
            onChange={(e) => {
              setMonthFilter(e.target.value);
              setPage(1);
            }}
          />

          <SelectField
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All categories</option>
            {activeCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </SelectField>
        </div>

        <SelectField
          value={recurrenceFilter}
          onChange={(e) => {
            setRecurrenceFilter(e.target.value as ExpenseRecurrence | "");
            setPage(1);
          }}
        >
          {RECURRENCE_OPTIONS.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : isError || !data ? (
          <div className="py-10 text-center">
            <p className="text-sm text-muted-foreground">Could not load expenses.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 text-sm font-medium text-primary hover:underline"
            >
              Retry
            </button>
          </div>
        ) : data.items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Receipt className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No expenses recorded for this period.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Expense</th>
                    <th className="pb-3 pr-4 font-medium">Category</th>
                    <th className="pb-3 pr-4 font-medium">Amount</th>
                    <th className="pb-3 pr-4 font-medium">Date</th>
                    <th className="pb-3 pr-4 font-medium">Recurrence</th>
                    <th className="pb-3 pr-4 font-medium">Recorded by</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((expense) => (
                    <tr key={expense.id} className="border-b border-border/60">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-foreground">{expense.title}</p>
                        {expense.description ? (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {expense.description}
                          </p>
                        ) : null}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {expense.categoryName}
                      </td>
                      <td className="py-3 pr-4 font-medium">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {formatShortDate(expense.expenseDate)}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {formatRecurrence(expense.recurrence)}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {expense.createdByName}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openEditExpense(expense)}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleArchiveExpense(expense)}
                            className="text-sm font-medium text-danger hover:underline"
                          >
                            Archive
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pagination={data.pagination} onPageChange={setPage} />
          </>
        )}
      </Card>

      <ExpenseFormDialog
        open={expenseDialogOpen}
        onClose={() => setExpenseDialogOpen(false)}
        onSubmit={handleExpenseSubmit}
        initial={editingExpense}
        isSubmitting={mutations.create.isPending || mutations.update.isPending}
      />

      <ExpenseCategoryDialog
        open={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        onSubmit={handleCategorySubmit}
        initial={editingCategory}
        isSubmitting={
          mutations.createCategory.isPending || mutations.updateCategory.isPending
        }
      />
    </div>
  );
}
