"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatNumber } from "@/lib/format";
import { PurchaseOrder } from "@/types";

interface ReceiveLine {
  itemId: string;
  productName: string;
  productSku: string;
  remainingQty: number;
  quantity: number;
}

interface ReceiveGoodsDialogProps {
  open: boolean;
  onClose: () => void;
  order: PurchaseOrder | null;
  onSubmit: (items: { itemId: string; quantity: number }[]) => Promise<void>;
  isSubmitting?: boolean;
}

export function ReceiveGoodsDialog({
  open,
  onClose,
  order,
  onSubmit,
  isSubmitting,
}: ReceiveGoodsDialogProps) {
  const [lines, setLines] = useState<ReceiveLine[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !order) return;

    setLines(
      order.items
        .filter((item) => item.remainingQty > 0)
        .map((item) => ({
          itemId: item.id,
          productName: item.productName,
          productSku: item.productSku,
          remainingQty: item.remainingQty,
          quantity: item.remainingQty,
        }))
    );
    setError(null);
  }, [open, order]);

  if (!open || !order) return null;

  async function handleReceive() {
    const items = lines.filter((line) => line.quantity > 0);
    if (items.length === 0) {
      setError("Enter quantity for at least one item");
      return;
    }

    for (const line of items) {
      if (line.quantity > line.remainingQty) {
        setError(`${line.productName}: cannot receive more than ${line.remainingQty}`);
        return;
      }
    }

    setError(null);
    await onSubmit(items.map((line) => ({ itemId: line.itemId, quantity: line.quantity })));
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Receive goods</h2>
            <p className="text-sm text-muted-foreground">{order.orderNumber}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Close
          </button>
        </div>

        {lines.length === 0 ? (
          <p className="text-sm text-muted-foreground">All items have been received.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Product</th>
                  <th className="pb-3 pr-4 font-medium">Remaining</th>
                  <th className="pb-3 font-medium">Receive qty</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => (
                  <tr key={line.itemId} className="border-b border-border/60">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-foreground">{line.productName}</p>
                      <p className="text-xs text-muted-foreground">{line.productSku}</p>
                    </td>
                    <td className="py-3 pr-4">{formatNumber(line.remainingQty)}</td>
                    <td className="py-3">
                      <Input
                        type="number"
                        min={0}
                        max={line.remainingQty}
                        value={line.quantity}
                        onChange={(e) => {
                          const quantity = Number(e.target.value) || 0;
                          setLines((prev) =>
                            prev.map((row, i) =>
                              i === index ? { ...row, quantity } : row
                            )
                          );
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            isLoading={isSubmitting}
            disabled={lines.length === 0}
            onClick={handleReceive}
          >
            Confirm receipt
          </Button>
        </div>
      </div>
    </div>
  );
}
