"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
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
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-white">
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary font-bold">
          R
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight">{APP_NAME}</p>
          <p className="text-xs text-white/60">Retail Management</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-xl bg-primary/20"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className="relative h-5 w-5 shrink-0" aria-hidden />
                  <span className="relative">{item.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-xl bg-white/5 p-3">
          {user ? (
            <>
              <p className="text-xs font-medium text-white/90">
                {user.firstName} {user.lastName}
              </p>
              <p className="mt-1 text-xs text-white/50">
                {formatRole(user.role)}
              </p>
            </>
          ) : (
            <>
              <p className="text-xs font-medium text-white/90">RetailMind</p>
              <p className="mt-1 text-xs text-white/50">Phase 3 — Authentication</p>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
