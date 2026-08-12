import {
  PrismaClient,
  UserRoleName,
  ProductStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PROD_PASSWORD = process.env.ADMIN_PASSWORD || "AdminPassword123!";

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function main() {
  console.log("Checking if database needs seeding...\n");

  // Check if we already have any products
  const existingProducts = await prisma.product.count();
  if (existingProducts > 0) {
    console.log(`✅ Database already has ${existingProducts} products. Skipping seed.`);
    return;
  }

  console.log("Database is empty. Running minimal seed...\n");

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
    { name: "customers.manage", module: "customers", action: "manage", description: "Manage customers" },
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
    "customers.manage",
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

  // ─── Categories & Brands ─────────────────────────────────────────────────
  const categories = await Promise.all(
    ["Beverages", "Snacks", "Personal Care", "Household", "Electronics"].map(
      (name) =>
        prisma.category.upsert({
          where: { name },
          update: {},
          create: { name, description: `${name} category` },
        })
    )
  );

  const brands = await Promise.all(
    ["Nestlé", "Unilever", "San Miguel", "Procter & Gamble", "Samsung"].map(
      (name) =>
        prisma.brand.upsert({
          where: { name },
          update: {},
          create: { name },
        })
    )
  );

  // ─── Minimal Products (just 5 for testing) ─────────────────────────────────
  const productDefs = [
    { sku: "BEV-001", barcode: "4800123456001", name: "Bottled Water 500ml", category: 0, brand: 0, cost: 8, price: 15, stock: 200, min: 50 },
    { sku: "SNK-001", barcode: "4800123456002", name: "Potato Chips 150g", category: 1, brand: 0, cost: 35, price: 55, stock: 120, min: 30 },
    { sku: "PC-001", barcode: "4800123456003", name: "Shampoo 180ml", category: 2, brand: 1, cost: 65, price: 99, stock: 60, min: 15 },
    { sku: "HH-001", barcode: "4800123456004", name: "Dish Soap 500ml", category: 3, brand: 1, cost: 55, price: 85, stock: 45, min: 15 },
    { sku: "ELC-001", barcode: "4800123456005", name: "USB-C Cable 1m", category: 4, brand: 4, cost: 80, price: 149, stock: 25, min: 8 },
  ];

  const products = [];
  for (const p of productDefs) {
    const existing = await prisma.product.findFirst({
      where: { sku: p.sku, deletedAt: null }
    });
    
    if (existing) {
      products.push(existing);
      continue;
    }

    const product = await prisma.product.create({
      data: {
        sku: p.sku,
        barcode: p.barcode,
        name: p.name,
        description: `${p.name} — retail product`,
        categoryId: categories[p.category].id,
        brandId: brands[p.brand].id,
        supplierId: null,
        costPrice: p.cost,
        sellingPrice: p.price,
        currentStock: p.stock,
        minStock: p.min,
        maxStock: p.stock * 3,
        status: ProductStatus.ACTIVE,
      },
    });

    await prisma.inventory.create({
      data: {
        productId: product.id,
        quantity: p.stock,
        location: "Main Store",
        lastRestockedAt: new Date(),
      },
    });
    products.push(product);
  }

  // ─── Settings ────────────────────────────────────────────────────────────
  const settings = [
    { key: "store.name", value: "RetailMind Demo Store", description: "Store display name", isPublic: true },
    { key: "store.address", value: "Manila, Philippines", description: "Store address", isPublic: true },
    { key: "tax.rate", value: "0.12", description: "VAT rate (12%)", isPublic: false },
    { key: "currency", value: "PHP", description: "Default currency", isPublic: true },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }

  console.log("✅ Minimal seed completed successfully.\n");
  console.log("─── PRODUCTION CREDENTIALS ───");
  console.log(`Password for all users: ${PROD_PASSWORD}`);
  console.log("⚠️  CHANGE THIS PASSWORD IMMEDIATELY IN PRODUCTION!\n");
  console.log("Users:");
  console.log(`  Admin:   admin@retailmind.dev`);
  console.log(`  Manager: manager@retailmind.dev`);
  console.log(`  Cashier: cashier@retailmind.dev\n`);
  console.log("─── SEED DATA SUMMARY ───");
  console.log(`Users: 3 (Admin, Manager, Cashier)`);
  console.log(`Roles: 3 (Administrator, Store Manager, Cashier)`);
  console.log(`Permissions: ${allPermissionIds.length}`);
  console.log(`Categories: ${categories.length}`);
  console.log(`Brands: ${brands.length}`);
  console.log(`Products: ${products.length}\n`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });