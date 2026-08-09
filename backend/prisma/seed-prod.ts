import {
  PrismaClient,
  UserRoleName,
  ActivityAction,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PROD_PASSWORD = process.env.ADMIN_PASSWORD || "ChangeMe123!";
const PROD_PASSWORD_LABEL = "PRODUCTION — change ADMIN_PASSWORD in environment variables";

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function main() {
  console.log("Seeding RetailMind production database...\n");

  // ─── Roles ───────────────────────────────────────────────────────────────
  const roles = await Promise.all(
    [
      { name: UserRoleName.ADMINISTRATOR, description: "Full system access" },
      { name: UserRoleName.STORE_MANAGER, description: "Store operations and reporting" },
      { name: UserRoleName.CASHIER, description: "POS and daily transactions" },
    ].map((role) =>
      prisma.role.upsert({
        where: { name: role.name },
        update: {},
        create: role,
      })
    )
  );

  const [adminRole, managerRole, cashierRole] = roles;

  // ─── Permissions ─────────────────────────────────────────────────────────
  const permissionDefs = [
    { name: "users.manage", module: "users", action: "manage", description: "Manage users" },
    { name: "products.manage", module: "products", action: "manage", description: "Manage products" },
    { name: "inventory.manage", module: "inventory", action: "manage", description: "Manage inventory" },
    { name: "sales.create", module: "sales", action: "create", description: "Process sales" },
    { name: "sales.refund", module: "sales", action: "refund", description: "Process refunds" },
    { name: "reports.view", module: "reports", action: "view", description: "View reports" },
    { name: "analytics.view", module: "analytics", action: "view", description: "View AI analytics" },
    { name: "settings.manage", module: "settings", action: "manage", description: "Manage settings" },
    { name: "expenses.manage", module: "expenses", action: "manage", description: "Manage expenses" },
    { name: "purchase_orders.manage", module: "purchase_orders", action: "manage", description: "Manage POs" },
  ];

  const permissions = await Promise.all(
    permissionDefs.map((p) =>
      prisma.permission.upsert({
        where: { name: p.name },
        update: {},
        create: p,
      })
    )
  );

  const allPermissionIds = permissions.map((p) => p.id);
  const managerPermissionNames = [
    "products.manage",
    "inventory.manage",
    "sales.create",
    "sales.refund",
    "reports.view",
    "analytics.view",
    "expenses.manage",
    "purchase_orders.manage",
  ];
  const cashierPermissionNames = ["sales.create", "sales.refund"];

  async function assignPermissions(roleId: string, names: string[]) {
    const ids = permissions.filter((p) => names.includes(p.name)).map((p) => p.id);
    await prisma.rolePermission.deleteMany({ where: { roleId } });
    await prisma.rolePermission.createMany({
      data: ids.map((permissionId) => ({ roleId, permissionId })),
    });
  }

  await assignPermissions(adminRole.id, permissionDefs.map((p) => p.name));
  await assignPermissions(managerRole.id, managerPermissionNames);
  await assignPermissions(cashierRole.id, cashierPermissionNames);

  // ─── Users ───────────────────────────────────────────────────────────────
  const passwordHash = await hashPassword(PROD_PASSWORD);

  const admin = await prisma.user.upsert({
    where: { email: "admin@retailmind.dev" },
    update: {},
    create: {
      email: "admin@retailmind.dev",
      passwordHash,
      firstName: "Alex",
      lastName: "Administrator",
      phone: "+63 917 000 0001",
      roleId: adminRole.id,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@retailmind.dev" },
    update: {},
    create: {
      email: "manager@retailmind.dev",
      passwordHash,
      firstName: "Maria",
      lastName: "Santos",
      phone: "+63 917 000 0002",
      roleId: managerRole.id,
    },
  });

  const cashier = await prisma.user.upsert({
    where: { email: "cashier@retailmind.dev" },
    update: {},
    create: {
      email: "cashier@retailmind.dev",
      passwordHash,
      firstName: "Juan",
      lastName: "Reyes",
      phone: "+63 917 000 0003",
      roleId: cashierRole.id,
    },
  });

  console.log("─── PRODUCTION CREDENTIALS ───");
  console.log(`Password for all users: ${PROD_PASSWORD}`);
  console.log(`Label: ${PROD_PASSWORD_LABEL}`);
  console.log("\nUsers:");
  console.log("  Admin:   admin@retailmind.dev");
  console.log("  Manager: manager@retailmind.dev");
  console.log("  Cashier: cashier@retailmind.dev");
  console.log("\nPermissions: 10");
  console.log("Seed completed successfully.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
