"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Search, Users } from "lucide-react";
import { EmployeeFormDialog } from "@/components/employees/employee-form-dialog";
import { Pagination, SelectField, StatusBadge } from "@/components/shared/table-utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useEmployeeList, useEmployeeMutations, useRoles } from "@/hooks/use-users";
import { ApiError } from "@/lib/api-client";
import { EmployeeFormValues, ROLE_LABELS } from "@/schemas/user.schema";
import { Employee, UserRole } from "@/types";

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleString();
}

function toPayload(values: EmployeeFormValues, isEdit: boolean) {
  const payload: Record<string, unknown> = {
    email: values.email,
    firstName: values.firstName,
    lastName: values.lastName,
    phone: values.phone || null,
    role: values.role,
  };

  if (values.password) {
    payload.password = values.password;
  }

  if (isEdit && values.isActive !== undefined) {
    payload.isActive = values.isActive === "true";
  }

  return payload;
}

export function EmployeeDirectory() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

  const params = useMemo(
    () => ({
      page,
      limit: 15,
      search: search || undefined,
      isActive:
        activeFilter === "true" ? true : activeFilter === "false" ? false : undefined,
      role: (roleFilter as UserRole) || undefined,
    }),
    [page, search, activeFilter, roleFilter]
  );

  const { data, isLoading, isError, refetch } = useEmployeeList(params);
  const { data: roles = [] } = useRoles();
  const { create, update, archive } = useEmployeeMutations();

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(employee: Employee) {
    setEditing(employee);
    setDialogOpen(true);
  }

  async function handleSubmit(values: EmployeeFormValues) {
    try {
      const payload = toPayload(values, !!editing);
      if (editing) {
        await update.mutateAsync({ id: editing.id, payload });
        toast.success("Employee updated");
      } else {
        await create.mutateAsync(payload);
        toast.success("Employee created");
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Request failed");
      throw err;
    }
  }

  async function handleArchive(employee: Employee) {
    if (!confirm(`Archive ${employee.fullName}? They will no longer be able to sign in.`)) {
      return;
    }
    try {
      await archive.mutateAsync(employee.id);
      toast.success("Employee archived");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Archive failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Employee directory</h2>
          <p className="text-sm text-muted-foreground">
            Manage staff accounts, roles, and access levels.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add employee
        </Button>
      </div>

      <Card className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <form
            className="flex gap-2 md:col-span-1"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setSearch(searchInput.trim());
            }}
          >
            <Input
              placeholder="Search name or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <Button type="submit" variant="secondary">
              <Search className="h-4 w-4" />
            </Button>
          </form>

          <SelectField
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All roles</option>
            {roles.map((role) => (
              <option key={role.id} value={role.name}>
                {ROLE_LABELS[role.name] ?? role.name}
              </option>
            ))}
          </SelectField>

          <SelectField
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All employees</option>
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
            <p className="text-sm text-muted-foreground">Could not load employees.</p>
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
            <p className="text-sm text-muted-foreground">No employees match your filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Employee</th>
                    <th className="pb-3 pr-4 font-medium">Contact</th>
                    <th className="pb-3 pr-4 font-medium">Role</th>
                    <th className="pb-3 pr-4 font-medium">Last login</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((employee) => (
                    <tr key={employee.id} className="border-b border-border/60">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-foreground">{employee.fullName}</p>
                        <p className="text-xs text-muted-foreground">{employee.email}</p>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {employee.phone ?? "—"}
                      </td>
                      <td className="py-3 pr-4">
                        {ROLE_LABELS[employee.role] ?? employee.role}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {formatDate(employee.lastLoginAt)}
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={employee.isActive ? "ACTIVE" : "INACTIVE"} />
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(employee)}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleArchive(employee)}
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

      <EmployeeFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        initial={editing}
        roles={roles}
        isSubmitting={create.isPending || update.isPending}
      />
    </div>
  );
}
