"use client";

import { Bell, LogOut, Search } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";

interface HeaderProps {
  title: string;
  description?: string;
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function formatRole(role: string): string {
  return role
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

export function Header({ title, description }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              placeholder="Search..."
              aria-label="Search"
              className="h-10 w-64 rounded-xl border border-border bg-background pl-10 pr-4 text-sm outline-none transition-shadow focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <button
            type="button"
            aria-label="Notifications"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
          >
            <Bell className="h-5 w-5" />
          </button>

          {user && (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-1.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-white">
                {getInitials(user.firstName, user.lastName)}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-foreground">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatRole(user.role)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => logout()}
                aria-label="Log out"
                className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
