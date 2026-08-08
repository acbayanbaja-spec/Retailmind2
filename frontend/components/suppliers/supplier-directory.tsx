"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Search, Truck } from "lucide-react";
import { SupplierFormDialog } from "@/components/suppliers/supplier-form-dialog";
import { Pagination, SelectField, StatusBadge } from "@/components/shared/table-utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSupplierList, useSupplierMutations } from "@/hooks/use-suppliers";
import { ApiError } from "@/lib/api-client";
import { SupplierFormValues } from "@/schemas/customer.schema";
import { Supplier } from "@/types";

function toPayload(values: SupplierFormValues, isEdit: boolean) {
  return {
    name: values.name,
    contactPerson: values.contactPerson || null,
    email: values.email || null,
    phone: values.phone || null,
    address: values.address || null,
    city: values.city || null,
    country: values.country || "Philippines",
    notes: values.notes || null,
    ...(isEdit && values.isActive !== undefined
      ? { isActive: values.isActive === "true" }
      : {}),
  };
}

export function SupplierDirectory() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);

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

  const { data, isLoading, isError, refetch } = useSupplierList(params);
  const { create, update, archive } = useSupplierMutations();

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(supplier: Supplier) {
    setEditing(supplier);
    setDialogOpen(true);
  }

  async function handleSubmit(values: SupplierFormValues) {
    try {
      const payload = toPayload(values, !!editing);
      if (editing) {
        await update.mutateAsync({ id: editing.id, payload });
        toast.success("Supplier updated");
      } else {
        await create.mutateAsync(payload);
        toast.success("Supplier created");
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Request failed");
      throw err;
    }
  }

  async function handleArchive(supplier: Supplier) {
    if (
      !confirm(
        `Archive ${supplier.name}? Linked products must be reassigned first if any exist.`
      )
    ) {
      return;
    }
    try {
      await archive.mutateAsync(supplier.id);
      toast.success("Supplier archived");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Archive failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Supplier directory</h2>
          <p className="text-sm text-muted-foreground">
            Manage vendor contacts and linked product counts.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add supplier
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
              placeholder="Search name, contact, email..."
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
            <option value="">All suppliers</option>
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
            <p className="text-sm text-muted-foreground">Could not load suppliers.</p>
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
            <Truck className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No suppliers match your filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Supplier</th>
                    <th className="pb-3 pr-4 font-medium">Contact</th>
                    <th className="pb-3 pr-4 font-medium">Location</th>
                    <th className="pb-3 pr-4 font-medium">Products</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((supplier) => (
                    <tr key={supplier.id} className="border-b border-border/60">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-foreground">{supplier.name}</p>
                        {supplier.contactPerson ? (
                          <p className="text-xs text-muted-foreground">
                            {supplier.contactPerson}
                          </p>
                        ) : null}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        <p>{supplier.email ?? "—"}</p>
                        <p className="text-xs">{supplier.phone ?? "—"}</p>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {[supplier.city, supplier.country].filter(Boolean).join(", ") || "—"}
                      </td>
                      <td className="py-3 pr-4">{supplier.productCount}</td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={supplier.isActive ? "ACTIVE" : "INACTIVE"} />
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(supplier)}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleArchive(supplier)}
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

      <SupplierFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        initial={editing}
        isSubmitting={create.isPending || update.isPending}
      />
    </div>
  );
}
