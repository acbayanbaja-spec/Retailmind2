import {
  PrismaClient,
  UserRoleName,
  ProductStatus,
  PurchaseOrderStatus,
  PaymentMethod,
  PaymentStatus,
  SaleStatus,
  MembershipLevel,
  ExpenseRecurrence,
  ActivityAction,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEV_PASSWORD = "DevPassword123!";
const DEV_PASSWORD_LABEL = "DEVELOPMENT ONLY — change before production";

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function main() {
  console.log("Seeding RetailMind development database...\n");

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
  const passwordHash = await hashPassword(DEV_PASSWORD);

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

  // ─── Suppliers ───────────────────────────────────────────────────────────
  const suppliers = await Promise.all([
    prisma.supplier.upsert({
      where: { id: "00000000-0000-4000-8000-000000000001" },
      update: {},
      create: {
        id: "00000000-0000-4000-8000-000000000001",
        name: "Metro Wholesale Supply",
        contactPerson: "Roberto Cruz",
        email: "orders@metrowholesale.dev",
        phone: "+63 2 8888 1001",
        address: "123 Industrial Ave",
        city: "Quezon City",
      },
    }),
    prisma.supplier.upsert({
      where: { id: "00000000-0000-4000-8000-000000000002" },
      update: {},
      create: {
        id: "00000000-0000-4000-8000-000000000002",
        name: "Pacific Goods Trading",
        contactPerson: "Lisa Tan",
        email: "sales@pacificgoods.dev",
        phone: "+63 2 8888 1002",
        address: "456 Commerce St",
        city: "Makati",
      },
    }),
  ]);

  // ─── Products ────────────────────────────────────────────────────────────
  const productDefs = [
    { sku: "BEV-001", barcode: "4800123456001", name: "Bottled Water 500ml", category: 0, brand: 0, supplier: 0, cost: 8, price: 15, stock: 200, min: 50 },
    { sku: "BEV-002", barcode: "4800123456002", name: "Energy Drink 250ml", category: 0, brand: 2, supplier: 0, cost: 25, price: 45, stock: 80, min: 20 },
    { sku: "SNK-001", barcode: "4800123456003", name: "Potato Chips 150g", category: 1, brand: 0, supplier: 1, cost: 35, price: 55, stock: 120, min: 30 },
    { sku: "SNK-002", barcode: "4800123456004", name: "Chocolate Bar 40g", category: 1, brand: 0, supplier: 1, cost: 18, price: 30, stock: 150, min: 40 },
    { sku: "PC-001", barcode: "4800123456005", name: "Shampoo 180ml", category: 2, brand: 1, supplier: 0, cost: 65, price: 99, stock: 60, min: 15 },
    { sku: "PC-002", barcode: "4800123456006", name: "Toothpaste 150g", category: 2, brand: 3, supplier: 0, cost: 45, price: 75, stock: 90, min: 25 },
    { sku: "HH-001", barcode: "4800123456007", name: "Dish Soap 500ml", category: 3, brand: 1, supplier: 1, cost: 55, price: 85, stock: 45, min: 15 },
    { sku: "HH-002", barcode: "4800123456008", name: "Laundry Detergent 1kg", category: 3, brand: 3, supplier: 1, cost: 120, price: 175, stock: 35, min: 10 },
    { sku: "ELC-001", barcode: "4800123456009", name: "USB-C Cable 1m", category: 4, brand: 4, supplier: 0, cost: 80, price: 149, stock: 25, min: 8 },
    { sku: "ELC-002", barcode: "4800123456010", name: "Wireless Earbuds", category: 4, brand: 4, supplier: 0, cost: 450, price: 799, stock: 12, min: 5 },
  ];

  const products = [];
  for (const p of productDefs) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        sku: p.sku,
        barcode: p.barcode,
        name: p.name,
        description: `${p.name} — retail product`,
        categoryId: categories[p.category].id,
        brandId: brands[p.brand].id,
        supplierId: suppliers[p.supplier].id,
        costPrice: p.cost,
        sellingPrice: p.price,
        currentStock: p.stock,
        minStock: p.min,
        maxStock: p.stock * 3,
        status: ProductStatus.ACTIVE,
      },
    });
    products.push(product);

    await prisma.inventory.upsert({
      where: { productId: product.id },
      update: { quantity: p.stock },
      create: {
        productId: product.id,
        quantity: p.stock,
        location: "Main Store",
        lastRestockedAt: new Date(),
      },
    });
  }

  // ─── Customers ───────────────────────────────────────────────────────────
  const customerDefs = [
    { firstName: "Ana", lastName: "Garcia", email: "ana.garcia@email.dev", phone: "+63 918 111 0001", level: MembershipLevel.GOLD, points: 850 },
    { firstName: "Carlos", lastName: "Mendoza", email: "carlos.mendoza@email.dev", phone: "+63 918 111 0002", level: MembershipLevel.SILVER, points: 420 },
    { firstName: "Elena", lastName: "Torres", email: "elena.torres@email.dev", phone: "+63 918 111 0003", level: MembershipLevel.BRONZE, points: 150 },
    { firstName: "Walk-in", lastName: "Customer", email: null, phone: null, level: MembershipLevel.BRONZE, points: 0 },
  ];

  const customers = [];
  for (const c of customerDefs) {
    const customer = c.email
      ? await prisma.customer.upsert({
          where: { email: c.email },
          update: {},
          create: {
            firstName: c.firstName,
            lastName: c.lastName,
            email: c.email,
            phone: c.phone,
            totalSpent: 0,
          },
        })
      : await prisma.customer.create({
          data: {
            firstName: c.firstName,
            lastName: c.lastName,
            totalSpent: 0,
          },
        });

    await prisma.customerMembership.upsert({
      where: { customerId: customer.id },
      update: { level: c.level, loyaltyPoints: c.points },
      create: {
        customerId: customer.id,
        level: c.level,
        loyaltyPoints: c.points,
      },
    });

    customers.push(customer);
  }

  // ─── Expense Categories & Expenses ───────────────────────────────────────
  const expenseCategories = await Promise.all(
    ["Rent", "Utilities", "Salaries", "Supplies", "Marketing"].map((name) =>
      prisma.expenseCategory.upsert({
        where: { name },
        update: {},
        create: { name, description: `${name} expenses` },
      })
    )
  );

  const now = new Date();
  await prisma.expense.createMany({
    data: [
      { categoryId: expenseCategories[0].id, title: "Monthly Store Rent", amount: 45000, expenseDate: new Date(now.getFullYear(), now.getMonth(), 1), recurrence: ExpenseRecurrence.MONTHLY, createdById: admin.id },
      { categoryId: expenseCategories[1].id, title: "Electricity Bill", amount: 8500, expenseDate: new Date(now.getFullYear(), now.getMonth(), 5), recurrence: ExpenseRecurrence.MONTHLY, createdById: manager.id },
      { categoryId: expenseCategories[2].id, title: "Staff Salaries", amount: 120000, expenseDate: new Date(now.getFullYear(), now.getMonth(), 15), recurrence: ExpenseRecurrence.MONTHLY, createdById: admin.id },
      { categoryId: expenseCategories[3].id, title: "Cleaning Supplies", amount: 2500, expenseDate: new Date(now.getFullYear(), now.getMonth(), 10), recurrence: ExpenseRecurrence.NONE, createdById: manager.id },
      { categoryId: expenseCategories[4].id, title: "Social Media Ads", amount: 5000, expenseDate: new Date(now.getFullYear(), now.getMonth(), 20), recurrence: ExpenseRecurrence.NONE, createdById: admin.id },
    ],
    skipDuplicates: true,
  });

  // ─── Sample Sales (last 30 days) ─────────────────────────────────────────
  const paymentMethods = [PaymentMethod.CASH, PaymentMethod.GCASH, PaymentMethod.CARD];
  let saleCounter = 1;

  for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
    const salesPerDay = Math.floor(Math.random() * 4) + 2;

    for (let s = 0; s < salesPerDay; s++) {
      const saleDate = new Date(now);
      saleDate.setDate(saleDate.getDate() - dayOffset);
      saleDate.setHours(9 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));

      const itemCount = Math.floor(Math.random() * 3) + 1;
      const saleItems = [];
      let subtotal = 0;

      for (let i = 0; i < itemCount; i++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const qty = Math.floor(Math.random() * 3) + 1;
        const unitPrice = Number(product.sellingPrice);
        const totalPrice = unitPrice * qty;
        subtotal += totalPrice;
        saleItems.push({ productId: product.id, quantity: qty, unitPrice, totalPrice });
      }

      const taxAmount = Math.round(subtotal * 0.12 * 100) / 100;
      const totalAmount = subtotal + taxAmount;
      const customer = customers[Math.floor(Math.random() * (customers.length - 1))];
      const saleNumber = `SALE-${String(saleCounter).padStart(6, "0")}`;
      saleCounter++;

      const sale = await prisma.sale.create({
        data: {
          saleNumber,
          customerId: customer.id,
          cashierId: cashier.id,
          status: SaleStatus.COMPLETED,
          subtotal,
          taxAmount,
          totalAmount,
          loyaltyPointsEarned: Math.floor(totalAmount / 100),
          completedAt: saleDate,
          createdAt: saleDate,
          items: {
            create: saleItems,
          },
          payments: {
            create: {
              method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
              amount: totalAmount,
              status: PaymentStatus.COMPLETED,
              paidAt: saleDate,
            },
          },
        },
      });

      await prisma.customer.update({
        where: { id: customer.id },
        data: { totalSpent: { increment: totalAmount } },
      });

      await prisma.activityLog.create({
        data: {
          userId: cashier.id,
          action: ActivityAction.SALE,
          entityType: "sale",
          entityId: sale.id,
          description: `Sale ${saleNumber} completed — ₱${totalAmount.toFixed(2)}`,
          createdAt: saleDate,
        },
      });
    }
  }

  // ─── Purchase Order ──────────────────────────────────────────────────────
  const poNumber = "PO-2026-0001";
  const existingPo = await prisma.purchaseOrder.findUnique({ where: { orderNumber: poNumber } });

  if (!existingPo) {
    const poItems = products.slice(0, 4).map((p) => ({
      productId: p.id,
      quantity: 50,
      unitCost: Number(p.costPrice),
      totalCost: Number(p.costPrice) * 50,
    }));

    await prisma.purchaseOrder.create({
      data: {
        orderNumber: poNumber,
        supplierId: suppliers[0].id,
        status: PurchaseOrderStatus.APPROVED,
        totalAmount: poItems.reduce((sum, i) => sum + i.totalCost, 0),
        notes: "Restock order for fast-moving items",
        createdById: manager.id,
        items: { create: poItems },
      },
    });
  }

  // ─── Settings ────────────────────────────────────────────────────────────
  const settings = [
    { key: "store.name", value: "RetailMind Demo Store", description: "Store display name", isPublic: true },
    { key: "store.address", value: "Manila, Philippines", description: "Store address", isPublic: true },
    { key: "tax.rate", value: "0.12", description: "VAT rate (12%)", isPublic: false },
    { key: "currency", value: "PHP", description: "Default currency", isPublic: true },
    { key: "loyalty.points_per_100", value: "1", description: "Loyalty points earned per ₱100 spent", isPublic: false },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }

  // ─── Activity Logs ───────────────────────────────────────────────────────
  await prisma.activityLog.create({
    data: {
      userId: admin.id,
      action: ActivityAction.LOGIN,
      entityType: "user",
      entityId: admin.id,
      description: "Administrator logged in (seed)",
    },
  });

  console.log("Seed completed successfully.\n");
  console.log("─── DEVELOPMENT CREDENTIALS (DO NOT USE IN PRODUCTION) ───");
  console.log(`Password for all users: ${DEV_PASSWORD}`);
  console.log(`Label: ${DEV_PASSWORD_LABEL}\n`);
  console.log("Users:");
  console.log(`  Admin:   admin@retailmind.dev`);
  console.log(`  Manager: manager@retailmind.dev`);
  console.log(`  Cashier: cashier@retailmind.dev\n`);
  console.log(`Products: ${products.length}`);
  console.log(`Customers: ${customers.length}`);
  console.log(`Sales: ~${saleCounter - 1} (last 30 days)`);
  console.log(`Permissions: ${allPermissionIds.length}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
