"use client";

import { Bell, LogOut, Search, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/providers/auth-provider";

interface HeaderProps {
  title: string;
  description?: string;
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function Header({ title, description }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 glass border-b border-border/50">
      <div className="flex h-[72px] items-center justify-between gap-4 px-8">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="hidden min-w-0 sm:block"
        >
          <h1 className="text-xl font-bold text-primary">
            Hey, {user?.firstName ?? "there"}
          </h1>
          <p className="truncate text-sm text-muted-foreground">
            {description ?? title}
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="relative mx-auto hidden max-w-md flex-1 md:block"
        >
          <Search
            className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Search products, orders, customers..."
            aria-label="Search"
            className="h-11 w-full rounded-full border border-border bg-background-soft pl-11 pr-4 text-sm outline-none transition-all duration-300 placeholder:text-muted-foreground focus:border-primary/30 focus:ring-2 focus:ring-primary/15"
          />
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="flex items-center gap-2.5"
        >
          <button
            type="button"
            aria-label="Notifications"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-md transition-all duration-300 hover:bg-primary-dark hover:shadow-lg active:scale-95"
          >
            <Bell className="h-5 w-5" />
          </button>

          <button
            type="button"
            aria-label="Settings"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-md transition-all duration-300 hover:bg-primary-dark hover:shadow-lg active:scale-95"
          >
            <Settings className="h-5 w-5" />
          </button>

          {user && (
            <>
              <div className="hidden h-8 w-px bg-border sm:block" />

              <div className="flex items-center gap-2.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white shadow-md ring-2 ring-white">
                  {getInitials(user.firstName, user.lastName)}
                </div>

                <button
                  type="button"
                  onClick={() => logout()}
                  aria-label="Log out"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-all duration-300 hover:bg-muted hover:text-primary active:scale-95"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </header>
  );
}
