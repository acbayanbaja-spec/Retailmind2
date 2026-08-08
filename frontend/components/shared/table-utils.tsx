import { cn } from "@/lib/utils";
import { PaginationMeta } from "@/types";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function Pagination({ pagination, onPageChange }: PaginationProps) {
  const { page, totalPages, total } = pagination;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages} ({total} total)
      </p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export function SelectField({ label, className, id, children, ...props }: SelectFieldProps) {
  const selectId = id ?? props.name;

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          "flex h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition-shadow focus:ring-2 focus:ring-primary/20",
          className
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

export function StatusBadge({
  status,
  isLowStock,
}: {
  status: string;
  isLowStock?: boolean;
}) {
  if (isLowStock) {
    return (
      <span className="inline-flex rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">
        Low stock
      </span>
    );
  }

  const styles: Record<string, string> = {
    ACTIVE: "bg-success/10 text-success",
    INACTIVE: "bg-muted text-muted-foreground",
    DISCONTINUED: "bg-danger/10 text-danger",
    DRAFT: "bg-muted text-muted-foreground",
    PENDING: "bg-warning/10 text-warning",
    APPROVED: "bg-primary/10 text-primary",
    ORDERED: "bg-primary/10 text-primary",
    PARTIALLY_RECEIVED: "bg-warning/10 text-warning",
    RECEIVED: "bg-success/10 text-success",
    CANCELLED: "bg-danger/10 text-danger",
  };

  const label = status.replace(/_/g, " ").toLowerCase();

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        styles[status] ?? "bg-muted text-muted-foreground"
      )}
    >
      {label}
    </span>
  );
}
