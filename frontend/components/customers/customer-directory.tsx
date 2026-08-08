"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Search, Users } from "lucide-react";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { Pagination, SelectField, StatusBadge } from "@/components/shared/table-utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCustomerList, useCustomerMutations } from "@/hooks/use-customers";
import { ApiError } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";
import { CustomerFormValues } from "@/schemas/customer.schema";
import { Customer } from "@/types";

function toPayload(values: CustomerFormValues, isEdit: boolean) {
  return {
    firstName: values.firstName,
    lastName: values.lastName,
    email: values.email || null,
    phone: values.phone || null,
    address: values.address || null,
    city: values.city || null,
    level: values.level,
    ...(isEdit && values.isActive !== undefined
      ? { isActive: values.isActive === "true" }
      : {}),
  };
}

export function CustomerDirectory() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  const params = useMemo(
    () => ({
      page,
      limit: 15,
      search: search || undefined,
      isActive:
        activeFilter === "true" ? true : activeFilter === "false" ? false : undefined,
    }),
    [page, search, activeFilter]
  );

  const { data, isLoading, isError, refetch } = useCustomerList(params);
  const { create, update, archive } = useCustomerMutations();

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(customer: Customer) {
    setEditing(customer);
    setDialogOpen(true);
  }

  async function handleSubmit(values: CustomerFormValues) {
    try {
      const payload = toPayload(values, !!editing);
      if (editing) {
        await update.mutateAsync({ id: editing.id, payload });
        toast.success("Customer updated");
      } else {
        await create.mutateAsync(payload);
        toast.success("Customer created");
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Request failed");
      throw err;
    }
  }

  async function handleArchive(customer: Customer) {
    if (
      !confirm(`Archive ${customer.fullName}? They will no longer appear in active lists.`)
    ) {
      return;
    }
    try {
      await archive.mutateAsync(customer.id);
      toast.success("Customer archived");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Archive failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Customer directory</h2>
          <p className="text-sm text-muted-foreground">
            Manage profiles, membership tiers, and loyalty points.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add customer
        </Button>
      </div>

      <Card className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setSearch(searchInput.trim());
            }}
          >
            <Input
              placeholder="Search name, email, or phone..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <Button type="submit" variant="secondary">
              <Search className="h-4 w-4" />
            </Button>
          </form>

          <SelectField
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All customers</option>
            <option value="true">Active only</option>
            <option value="false">Inactive only</option>
          </SelectField>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : isError || !data ? (
          <div className="py-10 text-center">
            <p className="text-sm text-muted-foreground">Could not load customers.</p>
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
            <Users className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No customers match your filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Customer</th>
                    <th className="pb-3 pr-4 font-medium">Contact</th>
                    <th className="pb-3 pr-4 font-medium">Membership</th>
                    <th className="pb-3 pr-4 font-medium">Total spent</th>
                    <th className="pb-3 pr-4 font-medium">Sales</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((customer) => (
                    <tr key={customer.id} className="border-b border-border/60">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-foreground">{customer.fullName}</p>
                        {customer.city ? (
                          <p className="text-xs text-muted-foreground">{customer.city}</p>
                        ) : null}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        <p>{customer.email ?? "—"}</p>
                        <p className="text-xs">{customer.phone ?? "—"}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={customer.membership?.level ?? "BRONZE"} />
                        <p className="mt-1 text-xs text-muted-foreground">
                          {customer.membership?.loyaltyPoints ?? 0} pts
                        </p>
                      </td>
                      <td className="py-3 pr-4 font-medium">
                        {formatCurrency(customer.totalSpent)}
                      </td>
                      <td className="py-3 pr-4">{customer.salesCount}</td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={customer.isActive ? "ACTIVE" : "INACTIVE"} />
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(customer)}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleArchive(customer)}
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

      <CustomerFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        initial={editing}
        isSubmitting={create.isPending || update.isPending}
      />
    </div>
  );
}
