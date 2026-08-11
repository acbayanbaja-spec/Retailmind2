import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "accent";
  isLoading?: boolean;
}

export function Button({
  className,
  variant = "primary",
  isLoading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" &&
          "bg-primary text-white shadow-[0_4px_16px_rgba(123,44,191,0.3)] hover:bg-primary-dark hover:shadow-[0_6px_24px_rgba(123,44,191,0.4)]",
        variant === "secondary" &&
          "border border-border bg-card text-foreground shadow-sm hover:bg-muted hover:shadow-md",
        variant === "ghost" &&
          "text-muted-foreground hover:bg-muted hover:text-primary",
        variant === "accent" &&
          "bg-accent-yellow text-foreground shadow-sm hover:brightness-105",
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-4 w-4 rounded-full border-2 border-current border-t-transparent"
          />
          Please wait...
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
}
