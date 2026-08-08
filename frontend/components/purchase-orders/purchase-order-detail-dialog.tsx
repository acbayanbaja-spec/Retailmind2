"use client";

import { StatusBadge } from "@/components/shared/table-utils";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";
import { PurchaseOrder } from "@/types";

interface PurchaseOrderDetailDialogProps {
  open: boolean;
  onClose: () => void;
  order: PurchaseOrder | null;
  onEdit: () => void;
  onSubmit: () => void;
  onApprove: () => void;
  onMarkOrdered: () => void;
  onReceive: () => void;
  onCancel: () => void;
  onArchive: () => void;
  isBusy?: boolean;
}

export function PurchaseOrderDetailDialog({
  open,
  onClose,
  order,
  onEdit,
  onSubmit,
  onApprove,
  onMarkOrdered,
  onReceive,
  onCancel,
  onArchive,
  isBusy,
}: PurchaseOrderDetailDialogProps) {
  if (!open || !order) return null;

  const canEdit = order.status === "DRAFT";
  const canSubmit = order.status === "DRAFT";
  const canApprove = order.status === "DRAFT" || order.status === "PENDING";
  const canMarkOrdered = order.status === "APPROVED";
  const canReceive =
    order.status === "APPROVED" ||
    order.status === "ORDERED" ||
    order.status === "PARTIALLY_RECEIVED";
  const canCancel =
    order.status !== "RECEIVED" &&
    order.status !== "CANCELLED" &&
    order.totalReceivedQty === 0;
  const canArchive = order.status === "DRAFT" || order.status === "CANCELLED";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{order.orderNumber}</h2>
            <p className="text-sm text-muted-foreground">{order.supplierName}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={order.status} />
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Total amount</p>
            <p className="font-semibold text-foreground">{formatCurrency(order.totalAmount)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Created by</p>
            <p className="font-medium text-foreground">{order.createdByName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ordered</p>
            <p className="font-medium text-foreground">
              {order.orderedAt ? formatDateTime(order.orderedAt) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Received</p>
            <p className="font-medium text-foreground">
              {order.receivedAt ? formatDateTime(order.receivedAt) : "—"}
            </p>
          </div>
        </div>

        {order.notes ? (
          <p className="mb-6 rounded-xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            {order.notes}
          </p>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">Product</th>
                <th className="pb-3 pr-4 font-medium">Ordered</th>
                <th className="pb-3 pr-4 font-medium">Received</th>
                <th className="pb-3 pr-4 font-medium">Unit cost</th>
                <th className="pb-3 font-medium">Line total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-border/60">
                  <td className="py-3 pr-4">
                    <p className="font-medium text-foreground">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">{item.productSku}</p>
                  </td>
                  <td className="py-3 pr-4">{formatNumber(item.quantity)}</td>
                  <td className="py-3 pr-4">
                    {formatNumber(item.receivedQty)}
                    {item.remainingQty > 0 ? (
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({formatNumber(item.remainingQty)} left)
                      </span>
                    ) : null}
                  </td>
                  <td className="py-3 pr-4">{formatCurrency(item.unitCost)}</td>
                  <td className="py-3">{formatCurrency(item.totalCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          {canArchive ? (
            <Button type="button" variant="secondary" disabled={isBusy} onClick={onArchive}>
              Archive
            </Button>
          ) : null}
          {canCancel ? (
            <Button type="button" variant="secondary" disabled={isBusy} onClick={onCancel}>
              Cancel order
            </Button>
          ) : null}
          {canEdit ? (
            <Button type="button" variant="secondary" disabled={isBusy} onClick={onEdit}>
              Edit draft
            </Button>
          ) : null}
          {canSubmit ? (
            <Button type="button" disabled={isBusy} onClick={onSubmit}>
              Submit for approval
            </Button>
          ) : null}
          {canApprove ? (
            <Button type="button" disabled={isBusy} onClick={onApprove}>
              Approve
            </Button>
          ) : null}
          {canMarkOrdered ? (
            <Button type="button" disabled={isBusy} onClick={onMarkOrdered}>
              Mark as ordered
            </Button>
          ) : null}
          {canReceive ? (
            <Button type="button" disabled={isBusy} onClick={onReceive}>
              Receive goods
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
