import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  ClipboardList,
  Users,
  Truck,
  Receipt,
  FileBarChart,
  Brain,
  Shield,
  UserCog,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { NavItem, UserRole } from "@/types";

export interface SidebarNavItem extends NavItem {
  icon: LucideIcon;
}

export const NAV_ITEMS: SidebarNavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    title: "Point of Sale",
    href: "/pos",
    icon: ShoppingCart,
    roles: ["ADMINISTRATOR", "STORE_MANAGER", "CASHIER"],
  },
  {
    title: "Products",
    href: "/products",
    icon: Package,
    roles: ["ADMINISTRATOR", "STORE_MANAGER"],
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: Warehouse,
    roles: ["ADMINISTRATOR", "STORE_MANAGER"],
  },
  {
    title: "Purchase Orders",
    href: "/purchase-orders",
    icon: ClipboardList,
    roles: ["ADMINISTRATOR", "STORE_MANAGER"],
  },
  {
    title: "Customers",
    href: "/customers",
    icon: Users,
    roles: ["ADMINISTRATOR", "STORE_MANAGER"],
  },
  {
    title: "Suppliers",
    href: "/suppliers",
    icon: Truck,
    roles: ["ADMINISTRATOR", "STORE_MANAGER"],
  },
  {
    title: "Expenses",
    href: "/expenses",
    icon: Receipt,
    roles: ["ADMINISTRATOR", "STORE_MANAGER"],
  },
  {
    title: "Reports",
    href: "/reports",
    icon: FileBarChart,
    roles: ["ADMINISTRATOR", "STORE_MANAGER"],
  },
  {
    title: "AI Analytics",
    href: "/ai-analytics",
    icon: Brain,
    roles: ["ADMINISTRATOR", "STORE_MANAGER"],
  },
  {
    title: "Employees",
    href: "/employees",
    icon: UserCog,
    roles: ["ADMINISTRATOR"],
  },
  {
    title: "Audit Logs",
    href: "/audit-logs",
    icon: Shield,
    roles: ["ADMINISTRATOR"],
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["ADMINISTRATOR"],
  },
];

export function filterNavByRole(
  items: SidebarNavItem[],
  role?: UserRole
): SidebarNavItem[] {
  if (!role) return items.filter((item) => !item.roles);
  return items.filter((item) => !item.roles || item.roles.includes(role));
}
