import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    <div className="space-y-2">
      {label && (
        <motion.label
          htmlFor={inputId}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-semibold text-foreground"
        >
          {label}
        </motion.label>
      )}
      <motion.input
        id={inputId}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        whileFocus={{ scale: 1.01 }}
        className={cn(
          "flex h-12 w-full rounded-2xl border border-border bg-background-soft px-4 text-sm outline-none transition-all duration-300 placeholder:text-muted-foreground focus:border-primary/40 focus:bg-card focus:ring-2 focus:ring-primary/15",
          error && "border-danger focus:ring-danger/20",
          className
        )}
        {...props}
      />
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs font-medium text-danger"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
