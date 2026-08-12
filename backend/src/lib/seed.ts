import { PrismaClient, UserRoleName, ProductStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PROD_PASSWORD = process.env.ADMIN_PASSWORD || "DevPassword123!";

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function seedDatabase(force = false) {
  console.log("Checking if database needs seeding...\n");

  // Check if we already have any users (primary check for seeding)
  const existingUsers = await prisma.user.count();
  const existingProducts = await prisma.product.count();
  
  if (!force && existingUsers > 0 && existingProducts > 0) {
    console.log(`✅ Database already has ${existingUsers} users and ${existingProducts} products. Skipping seed.`);
    return;
  }

  console.log("Database needs seeding. Running seed...\n");

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
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        barcode: p.barcode,
        description: `${p.name} — retail product`,
        categoryId: categories[p.category].id,
        brandId: brands[p.brand].id,
        costPrice: p.cost,
        sellingPrice: p.price,
        currentStock: p.stock,
        minStock: p.min,
        maxStock: p.stock * 3,
        status: ProductStatus.ACTIVE,
        deletedAt: null, // Restore if soft-deleted
      },
      create: {
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

    // Ensure inventory record exists
    await prisma.inventory.upsert({
      where: { productId: product.id },
      update: {
        quantity: p.stock,
        location: "Main Store",
        lastRestockedAt: new Date(),
      },
      create: {
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

  // ─── Suppliers (Expanded) ───────────────────────────────────────────────
  const supplierDefs = [
    { name: "ABC Distributors", contactPerson: "John Smith", email: "john@abc.com", phone: "+63 917 000 0100", address: "123 Manila St", city: "Manila" },
    { name: "Global Supplies Inc", contactPerson: "Jane Doe", email: "jane@global.com", phone: "+63 917 000 0200", address: "456 Cebu Ave", city: "Cebu" },
    { name: "Philippine Traders", contactPerson: "Pedro Santos", email: "pedro@ptraders.com", phone: "+63 917 000 0300", address: "789 Davao Blvd", city: "Davao" },
    { name: "Metro Logistics", contactPerson: "Maria Reyes", email: "maria@metro.com", phone: "+63 917 000 0400", address: "321 Quezon Ave", city: "Quezon City" },
    { name: "Island Trading", contactPerson: "Carlos Garcia", email: "carlos@island.com", phone: "+63 917 000 0500", address: "654 Makati Ave", city: "Makati" },
  ];

  const suppliers = [];
  for (const s of supplierDefs) {
    const supplier = await prisma.supplier.upsert({
      where: { name: s.name },
      update: { deletedAt: null, isActive: true },
      create: { ...s, isActive: true },
    });
    suppliers.push(supplier);
  }

  // ─── Customers (Expanded) ───────────────────────────────────────────────
  const customerDefs = [
    { firstName: "Ana", lastName: "Santos", email: "ana.santos@email.com", phone: "+63 917 000 1001", address: "123 Main St", city: "Manila", level: "GOLD" },
    { firstName: "Jose", lastName: "Reyes", email: "jose.reyes@email.com", phone: "+63 917 000 1002", address: "456 Oak Ave", city: "Cebu", level: "SILVER" },
    { firstName: "Maria", lastName: "Garcia", email: "maria.garcia@email.com", phone: "+63 917 000 1003", address: "789 Pine Rd", city: "Davao", level: "BRONZE" },
    { firstName: "Carlos", lastName: "Mendoza", email: "carlos.mendoza@email.com", phone: "+63 917 000 1004", address: "321 Elm St", city: "Quezon City", level: "GOLD" },
    { firstName: "Sofia", lastName: "Ramos", email: "sofia.ramos@email.com", phone: "+63 917 000 1005", address: "654 Maple Dr", city: "Makati", level: "SILVER" },
    { firstName: "Miguel", lastName: "Cruz", email: "miguel.cruz@email.com", phone: "+63 917 000 1006", address: "987 Cedar Ln", city: "Manila", level: "BRONZE" },
    { firstName: "Isabella", lastName: "Flores", email: "isabella.flores@email.com", phone: "+63 917 000 1007", address: "147 Birch Way", city: "Cebu", level: "GOLD" },
    { firstName: "Diego", lastName: "Torres", email: "diego.torres@email.com", phone: "+63 917 000 1008", address: "258 Spruce St", city: "Davao", level: "SILVER" },
    { firstName: "Elena", lastName: "Rivera", email: "elena.rivera@email.com", phone: "+63 917 000 1009", address: "369 Aspen Ave", city: "Quezon City", level: "BRONZE" },
    { firstName: "Luis", lastName: "Castillo", email: "luis.castillo@email.com", phone: "+63 917 000 1010", address: "741 Willow Rd", city: "Makati", level: "GOLD" },
  ];

  const customers = [];
  for (const c of customerDefs) {
    const customer = await prisma.customer.upsert({
      where: { email: c.email },
      update: { deletedAt: null, isActive: true },
      create: { ...c, isActive: true },
    });
    customers.push(customer);
  }

  // ─── Expenses (Expanded) ─────────────────────────────────────────────────
  const expenseCategoryDefs = [
    { name: "Utilities", description: "Electricity, water, internet" },
    { name: "Rent", description: "Store rent and lease" },
    { name: "Salaries", description: "Employee salaries" },
    { name: "Supplies", description: "Office supplies" },
    { name: "Marketing", description: "Advertising and promotions" },
  ];

  const expenseCategories = [];
  for (const ec of expenseCategoryDefs) {
    const category = await prisma.expenseCategory.upsert({
      where: { name: ec.name },
      update: { deletedAt: null, isActive: true },
      create: { ...ec, isActive: true },
    });
    expenseCategories.push(category);
  }

  const expenseDefs = [
    { categoryId: 0, amount: 5000, description: "Electricity bill - July", date: new Date("2026-07-15") },
    { categoryId: 1, amount: 25000, description: "Monthly rent - July", date: new Date("2026-07-01") },
    { categoryId: 2, amount: 45000, description: "Staff salaries - July", date: new Date("2026-07-30") },
    { categoryId: 3, amount: 1500, description: "Office supplies", date: new Date("2026-07-10") },
    { categoryId: 4, amount: 3000, description: "Social media ads", date: new Date("2026-07-20") },
    { categoryId: 0, amount: 4800, description: "Water bill - July", date: new Date("2026-07-15") },
    { categoryId: 3, amount: 2200, description: "Packaging materials", date: new Date("2026-07-25") },
    { categoryId: 4, amount: 5000, description: "Flyer printing", date: new Date("2026-07-18") },
  ];

  const expenses = [];
  for (const e of expenseDefs) {
    const expense = await prisma.expense.upsert({
      where: { id: "" }, // Use create since we don't have unique IDs
      update: {},
      create: {
        categoryId: expenseCategories[e.categoryId].id,
        amount: e.amount,
        description: e.description,
        date: e.date,
        performedById: admin.id,
      },
    });
    expenses.push(expense);
  }

  // ─── Purchase Orders (Expanded) ─────────────────────────────────────────
  const poDefs = [
    { supplierId: 0, status: "RECEIVED", orderDate: new Date("2026-07-01"), expectedDate: new Date("2026-07-05"), totalAmount: 15000 },
    { supplierId: 1, status: "RECEIVED", orderDate: new Date("2026-07-10"), expectedDate: new Date("2026-07-15"), totalAmount: 22000 },
    { supplierId: 2, status: "ORDERED", orderDate: new Date("2026-07-20"), expectedDate: new Date("2026-07-25"), totalAmount: 18000 },
    { supplierId: 3, status: "PENDING", orderDate: new Date("2026-07-25"), expectedDate: new Date("2026-07-30"), totalAmount: 12000 },
    { supplierId: 4, status: "RECEIVED", orderDate: new Date("2026-07-05"), expectedDate: new Date("2026-07-10"), totalAmount: 25000 },
  ];

  const purchaseOrders = [];
  for (const po of poDefs) {
    const purchaseOrder = await prisma.purchaseOrder.upsert({
      where: { id: "" },
      update: {},
      create: {
        supplierId: suppliers[po.supplierId].id,
        status: po.status as any,
        orderDate: po.orderDate,
        expectedDate: po.expectedDate,
        totalAmount: po.totalAmount,
        createdById: admin.id,
      },
    });
    purchaseOrders.push(purchaseOrder);
  }

  // ─── Sales (Expanded) ───────────────────────────────────────────────────
  const saleDefs = [
    { customerId: 0, totalAmount: 250, status: "COMPLETED", saleDate: new Date("2026-07-01T10:30:00") },
    { customerId: 1, totalAmount: 450, status: "COMPLETED", saleDate: new Date("2026-07-02T14:15:00") },
    { customerId: 2, totalAmount: 180, status: "COMPLETED", saleDate: new Date("2026-07-03T09:45:00") },
    { customerId: 3, totalAmount: 320, status: "COMPLETED", saleDate: new Date("2026-07-04T16:20:00") },
    { customerId: 4, totalAmount: 590, status: "COMPLETED", saleDate: new Date("2026-07-05T11:00:00") },
    { customerId: 5, totalAmount: 210, status: "COMPLETED", saleDate: new Date("2026-07-06T13:30:00") },
    { customerId: 6, totalAmount: 380, status: "COMPLETED", saleDate: new Date("2026-07-07T15:45:00") },
    { customerId: 7, totalAmount: 460, status: "COMPLETED", saleDate: new Date("2026-07-08T10:15:00") },
    { customerId: 8, totalAmount: 290, status: "COMPLETED", saleDate: new Date("2026-07-09T14:00:00") },
    { customerId: 9, totalAmount: 520, status: "COMPLETED", saleDate: new Date("2026-07-10T12:30:00") },
  ];

  const sales = [];
  for (const s of saleDefs) {
    const sale = await prisma.sale.upsert({
      where: { id: "" },
      update: {},
      create: {
        customerId: customers[s.customerId].id,
        totalAmount: s.totalAmount,
        status: s.status as any,
        saleDate: s.saleDate,
        cashierId: cashier.id,
      },
    });
    sales.push(sale);
  }

  // ─── Activity Logs (Audit Logs) ───────────────────────────────────────────
  const activityDefs = [
    { userId: admin.id, action: "CREATE", entityType: "product", entityId: products[0].id, description: "Created product Bottled Water" },
    { userId: manager.id, action: "UPDATE", entityType: "product", entityId: products[1].id, description: "Updated product Potato Chips" },
    { userId: cashier.id, action: "CREATE", entityType: "sale", entityId: sales[0].id, description: "Created sale for customer Ana Santos" },
    { userId: admin.id, action: "CREATE", entityType: "supplier", entityId: suppliers[0].id, description: "Created supplier ABC Distributors" },
    { userId: manager.id, action: "CREATE", entityType: "customer", entityId: customers[0].id, description: "Created customer Ana Santos" },
    { userId: admin.id, action: "CREATE", entityType: "expense", entityId: expenses[0].id, description: "Created expense for utilities" },
    { userId: manager.id, action: "UPDATE", entityType: "purchase_order", entityId: purchaseOrders[0].id, description: "Updated purchase order status" },
    { userId: cashier.id, action: "CREATE", entityType: "sale", entityId: sales[1].id, description: "Created sale for customer Jose Reyes" },
  ];

  for (const a of activityDefs) {
    await prisma.activityLog.create({
      data: a,
    });
  }

  console.log("✅ Expanded seed completed successfully.\n");
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
  console.log(`Products: ${products.length}`);
  console.log(`Suppliers: ${suppliers.length}`);
  console.log(`Customers: ${customers.length}`);
  console.log(`Expense Categories: ${expenseCategories.length}`);
  console.log(`Expenses: ${expenses.length}`);
  console.log(`Purchase Orders: ${purchaseOrders.length}`);
  console.log(`Sales: ${sales.length}`);
  console.log(`Activity Logs: ${activityDefs.length}\n`);
}