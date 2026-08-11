"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { APP_NAME } from "@/lib/constants/colors";
import { filterNavByRole, NAV_ITEMS } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

function formatRole(role: string): string {
  return role
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const navItems = filterNavByRole(NAV_ITEMS, user?.role);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-[272px] flex-col bg-sidebar text-white shadow-[4px_0_32px_rgba(123,44,191,0.15)]">
      {/* Brand */}
      <div className="flex h-[72px] items-center px-7">
        <Link href="/dashboard" className="group flex items-center gap-1">
          <span className="text-2xl font-bold tracking-tight text-white transition-transform group-hover:scale-105">
            {APP_NAME}
          </span>
          <span className="text-2xl font-bold text-secondary">.</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-2" aria-label="Main navigation">
        <ul className="space-y-1.5">
          {navItems.map((item, index) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <motion.li
                key={item.href}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04, duration: 0.3 }}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300",
                    isActive
                      ? "bg-white text-primary shadow-md"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110",
                      isActive ? "text-primary" : "text-white/70"
                    )}
                    aria-hidden
                  />
                  <span>{item.title}</span>
                </Link>
              </motion.li>
            );
          })}
        </ul>
      </nav>

      {/* Upgrade card */}
      <div className="p-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-white/15 p-4 backdrop-blur-sm"
        >
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent-yellow" />
            <p className="text-xs font-semibold text-white/90">Pro Features</p>
          </div>
          <p className="text-xs leading-relaxed text-white/70">
            Upgrade your account to unlock AI analytics and advanced reports.
          </p>
          <button
            type="button"
            className="mt-3 w-full rounded-xl bg-white px-3 py-2 text-xs font-semibold text-primary transition-all hover:bg-white/90 hover:shadow-md active:scale-95"
          >
            Upgrade
          </button>
        </motion.div>
      </div>

      {/* User footer */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-3 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 text-sm font-bold text-white">
            {user ? user.firstName.charAt(0) + user.lastName.charAt(0) : "RM"}
          </div>
          {user ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-xs text-white/60">
                {formatRole(user.role)}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold text-white">{APP_NAME}</p>
              <p className="text-xs text-white/60">Retail Management</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
