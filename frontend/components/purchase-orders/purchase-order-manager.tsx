"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ClipboardList, Plus, Search } from "lucide-react";
import { PurchaseOrderDetailDialog } from "@/components/purchase-orders/purchase-order-detail-dialog";
import { PurchaseOrderFormDialog } from "@/components/purchase-orders/purchase-order-form-dialog";
import { ReceiveGoodsDialog } from "@/components/purchase-orders/receive-goods-dialog";
import { Pagination, SelectField, StatusBadge } from "@/components/shared/table-utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  usePurchaseOrder,
  usePurchaseOrderList,
  usePurchaseOrderMutations,
} from "@/hooks/use-purchase-orders";
import { ApiError } from "@/lib/api-client";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { PurchaseOrderFormValues } from "@/schemas/purchase-order.schema";
import { PurchaseOrder, PurchaseOrderStatus } from "@/types";

const STATUS_OPTIONS: { value: PurchaseOrderStatus | ""; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING", label: "Pending approval" },
  { value: "APPROVED", label: "Approved" },
  { value: "ORDERED", label: "Ordered" },
  { value: "PARTIALLY_RECEIVED", label: "Partially received" },
  { value: "RECEIVED", label: "Received" },
  { value: "CANCELLED", label: "Cancelled" },
];

function toPayload(values: PurchaseOrderFormValues) {
  return {
    supplierId: values.supplierId,
    notes: values.notes || null,
    items: values.items,
  };
}

export function PurchaseOrderManager() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | "">("");
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<PurchaseOrder | null>(null);

  const params = useMemo(
    () => ({
      page,
      limit: 15,
      search: search || undefined,
      status: statusFilter || undefined,
    }),
    [page, search, statusFilter]
  );

  const { data, isLoading, isError, refetch } = usePurchaseOrderList(params);
  const { data: selectedOrder } = usePurchaseOrder(selectedId);
  const mutations = usePurchaseOrderMutations();

  const isBusy =
    mutations.create.isPending ||
    mutations.update.isPending ||
    mutations.submit.isPending ||
    mutations.approve.isPending ||
    mutations.markOrdered.isPending ||
    mutations.receive.isPending ||
    mutations.cancel.isPending ||
    mutations.archive.isPending;

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openDetail(order: PurchaseOrder) {
    setSelectedId(order.id);
    setDetailOpen(true);
  }

  function openEditFromDetail() {
    if (!selectedOrder) return;
    setEditing(selectedOrder);
    setDetailOpen(false);
    setFormOpen(true);
  }

  async function handleSave(values: PurchaseOrderFormValues) {
    try {
      const payload = toPayload(values);
      if (editing) {
        await mutations.update.mutateAsync({ id: editing.id, payload });
        toast.success("Purchase order updated");
      } else {
        await mutations.create.mutateAsync(payload);
        toast.success("Purchase order created");
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Request failed");
      throw err;
    }
  }

  async function runAction(
    action: () => Promise<unknown>,
    successMessage: string
  ) {
    try {
      await action();
      toast.success(successMessage);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Action failed");
    }
  }

  async function handleReceive(items: { itemId: string; quantity: number }[]) {
    if (!selectedOrder) return;
    await runAction(
      () => mutations.receive.mutateAsync({ id: selectedOrder.id, payload: { items } }),
      "Goods received"
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Purchase orders</h2>
          <p className="text-sm text-muted-foreground">
            Create supplier orders, track approvals, and receive stock.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New purchase order
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
              placeholder="Search order number or supplier..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <Button type="submit" variant="secondary">
              <Search className="h-4 w-4" />
            </Button>
          </form>

          <SelectField
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as PurchaseOrderStatus | "");
              setPage(1);
            }}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
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
            <p className="text-sm text-muted-foreground">Could not load purchase orders.</p>
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
            <ClipboardList className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No purchase orders match your filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Order</th>
                    <th className="pb-3 pr-4 font-medium">Supplier</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 pr-4 font-medium">Total</th>
                    <th className="pb-3 pr-4 font-medium">Progress</th>
                    <th className="pb-3 pr-4 font-medium">Created</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((order) => (
                    <tr key={order.id} className="border-b border-border/60">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-foreground">{order.orderNumber}</p>
                        <p className="text-xs text-muted-foreground">{order.createdByName}</p>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{order.supplierName}</td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="py-3 pr-4 font-medium">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {order.totalReceivedQty} / {order.totalOrderedQty} units
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {formatDateTime(order.createdAt)}
                      </td>
                      <td className="py-3">
                        <button
                          type="button"
                          onClick={() => openDetail(order)}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          View
                        </button>
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

      <PurchaseOrderFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSave}
        initial={editing}
        isSubmitting={mutations.create.isPending || mutations.update.isPending}
      />

      <PurchaseOrderDetailDialog
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedId(null);
        }}
        order={selectedOrder ?? null}
        isBusy={isBusy}
        onEdit={openEditFromDetail}
        onSubmit={() =>
          selectedOrder &&
          runAction(() => mutations.submit.mutateAsync(selectedOrder.id), "Submitted for approval")
        }
        onApprove={() =>
          selectedOrder &&
          runAction(() => mutations.approve.mutateAsync(selectedOrder.id), "Purchase order approved")
        }
        onMarkOrdered={() =>
          selectedOrder &&
          runAction(
            () => mutations.markOrdered.mutateAsync(selectedOrder.id),
            "Marked as ordered"
          )
        }
        onReceive={() => setReceiveOpen(true)}
        onCancel={() => {
          if (!selectedOrder) return;
          if (!confirm(`Cancel ${selectedOrder.orderNumber}?`)) return;
          runAction(() => mutations.cancel.mutateAsync(selectedOrder.id), "Purchase order cancelled");
        }}
        onArchive={() => {
          if (!selectedOrder) return;
          if (!confirm(`Archive ${selectedOrder.orderNumber}?`)) return;
          runAction(async () => {
            await mutations.archive.mutateAsync(selectedOrder.id);
            setDetailOpen(false);
            setSelectedId(null);
          }, "Purchase order archived");
        }}
      />

      <ReceiveGoodsDialog
        open={receiveOpen}
        onClose={() => setReceiveOpen(false)}
        order={selectedOrder ?? null}
        onSubmit={handleReceive}
        isSubmitting={mutations.receive.isPending}
      />
    </div>
  );
}
