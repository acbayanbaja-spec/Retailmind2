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
    { name: "Pacific Wholesalers", contactPerson: "Anna Lee", email: "anna@pacific.com", phone: "+63 917 000 0600", address: "987 Pasay Rd", city: "Pasay" },
    { name: "Asian Importers", contactPerson: "Kim Tan", email: "kim@asian.com", phone: "+63 917 000 0700", address: "654 Taguig St", city: "Taguig" },
    { name: "City Merchants", contactPerson: "Rob Cruz", email: "rob@city.com", phone: "+63 917 000 0800", address: "321 Parañaque Ave", city: "Parañaque" },
    { name: "National Suppliers", contactPerson: "Luis Ramos", email: "luis@national.com", phone: "+63 917 000 0900", address: "147 Caloocan Blvd", city: "Caloocan" },
    { name: "Regional Distributors", contactPerson: "Grace Mendoza", email: "grace@regional.com", phone: "+63 917 000 1000", address: "258 Valenzuela St", city: "Valenzuela" },
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
    { name: "Maintenance", description: "Equipment maintenance" },
    { name: "Insurance", description: "Business insurance" },
    { name: "Shipping", description: "Shipping and delivery" },
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
    { categoryId: 5, amount: 3500, description: "AC maintenance", date: new Date("2026-07-12") },
    { categoryId: 6, amount: 8000, description: "Insurance premium", date: new Date("2026-07-05") },
    { categoryId: 7, amount: 4200, description: "Shipping costs", date: new Date("2026-07-22") },
    { categoryId: 0, amount: 3200, description: "Internet bill", date: new Date("2026-07-28") },
    { categoryId: 3, amount: 1800, description: "Receipt paper", date: new Date("2026-07-08") },
    { categoryId: 4, amount: 6500, description: "Radio ads", date: new Date("2026-07-14") },
    { categoryId: 5, amount: 2800, description: "Door repair", date: new Date("2026-07-19") },
    { categoryId: 7, amount: 5100, description: "Delivery fees", date: new Date("2026-07-26") },
  ];

  const expenses = [];
  for (const e of expenseDefs) {
    const expense = await prisma.expense.create({
      data: {
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
    { supplierId: 5, status: "RECEIVED", orderDate: new Date("2026-07-08"), expectedDate: new Date("2026-07-12"), totalAmount: 17000 },
    { supplierId: 6, status: "ORDERED", orderDate: new Date("2026-07-22"), expectedDate: new Date("2026-07-27"), totalAmount: 19500 },
    { supplierId: 7, status: "PENDING", orderDate: new Date("2026-07-26"), expectedDate: new Date("2026-07-31"), totalAmount: 14500 },
    { supplierId: 8, status: "RECEIVED", orderDate: new Date("2026-07-03"), expectedDate: new Date("2026-07-08"), totalAmount: 21000 },
    { supplierId: 9, status: "ORDERED", orderDate: new Date("2026-07-23"), expectedDate: new Date("2026-07-28"), totalAmount: 16500 },
  ];

  const purchaseOrders = [];
  for (const po of poDefs) {
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
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
    const sale = await prisma.sale.create({
      data: {
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
    { userId: admin.id, action: "CREATE", entityType: "product", entityId: products[5].id, description: "Created product Cola" },
    { userId: manager.id, action: "UPDATE", entityType: "customer", entityId: customers[5].id, description: "Updated customer Roberto Martinez" },
    { userId: cashier.id, action: "CREATE", entityType: "sale", entityId: sales[5].id, description: "Created sale for customer Carmen Lopez" },
    { userId: admin.id, action: "CREATE", entityType: "supplier", entityId: suppliers[5].id, description: "Created supplier Pacific Wholesalers" },
    { userId: manager.id, action: "CREATE", entityType: "expense", entityId: expenses[8].id, description: "Created expense for maintenance" },
    { userId: cashier.id, action: "CREATE", entityType: "sale", entityId: sales[10].id, description: "Created sale for customer Laura Thomas" },
    { userId: admin.id, action: "UPDATE", entityType: "purchase_order", entityId: purchaseOrders[5].id, description: "Updated purchase order to received" },
    { userId: manager.id, action: "CREATE", entityType: "product", entityId: products[10].id, description: "Created product Toothpaste" },
  ];

  for (const a of activityDefs) {
    await prisma.activityLog.create({
      data: a,
    });
  }

  // ─── Additional Products to reach higher count ───────────────────────────
  const additionalProductDefs = [
    { sku: "BEV-002", barcode: "4800123456006", name: "Cola 330ml", category: 0, brand: 0, cost: 12, price: 25, stock: 150, min: 40 },
    { sku: "BEV-003", barcode: "4800123456007", name: "Orange Juice 250ml", category: 0, brand: 0, cost: 18, price: 35, stock: 100, min: 30 },
    { sku: "BEV-004", barcode: "4800123456016", name: "Energy Drink 250ml", category: 0, brand: 0, cost: 25, price: 50, stock: 80, min: 20 },
    { sku: "BEV-005", barcode: "4800123456017", name: "Coffee 200ml", category: 0, brand: 0, cost: 15, price: 35, stock: 120, min: 30 },
    { sku: "BEV-006", barcode: "4800123456018", name: "Green Tea 500ml", category: 0, brand: 0, cost: 10, price: 22, stock: 90, min: 25 },
    { sku: "SNK-002", barcode: "4800123456008", name: "Chocolate Bar 50g", category: 1, brand: 0, cost: 25, price: 45, stock: 200, min: 50 },
    { sku: "SNK-003", barcode: "4800123456009", name: "Cookies 100g", category: 1, brand: 0, cost: 20, price: 40, stock: 180, min: 45 },
    { sku: "SNK-004", barcode: "4800123456019", name: "Chips 75g", category: 1, brand: 0, cost: 18, price: 38, stock: 150, min: 40 },
    { sku: "SNK-005", barcode: "4800123456020", name: "Candy 50g", category: 1, brand: 0, cost: 8, price: 18, stock: 250, min: 60 },
    { sku: "SNK-006", barcode: "4800123456021", name: "Nuts 100g", category: 1, brand: 0, cost: 30, price: 55, stock: 100, min: 25 },
    { sku: "PC-002", barcode: "4800123456010", name: "Toothpaste 100g", category: 2, brand: 1, cost: 45, price: 75, stock: 80, min: 20 },
    { sku: "PC-003", barcode: "4800123456011", name: "Soap Bar 90g", category: 2, brand: 1, cost: 15, price: 30, stock: 120, min: 30 },
    { sku: "PC-004", barcode: "4800123456022", name: "Shower Gel 250ml", category: 2, brand: 1, cost: 35, price: 65, stock: 70, min: 18 },
    { sku: "PC-005", barcode: "4800123456023", name: "Lotion 200ml", category: 2, brand: 1, cost: 40, price: 80, stock: 60, min: 15 },
    { sku: "PC-006", barcode: "4800123456024", name: "Deodorant 50ml", category: 2, brand: 1, cost: 50, price: 95, stock: 50, min: 12 },
    { sku: "HH-002", barcode: "4800123456012", name: "Laundry Detergent 1kg", category: 3, brand: 1, cost: 120, price: 180, stock: 60, min: 15 },
    { sku: "HH-003", barcode: "4800123456013", name: "Floor Cleaner 500ml", category: 3, brand: 1, cost: 45, price: 85, stock: 90, min: 25 },
    { sku: "HH-004", barcode: "4800123456025", name: "Dish Soap 750ml", category: 3, brand: 1, cost: 55, price: 95, stock: 75, min: 20 },
    { sku: "HH-005", barcode: "4800123456026", name: "Glass Cleaner 500ml", category: 3, brand: 1, cost: 40, price: 75, stock: 65, min: 18 },
    { sku: "HH-006", barcode: "4800123456027", name: "Bleach 1L", category: 3, brand: 1, cost: 35, price: 65, stock: 85, min: 22 },
    { sku: "ELC-002", barcode: "4800123456014", name: "Phone Charger", category: 4, brand: 4, cost: 150, price: 299, stock: 40, min: 10 },
    { sku: "ELC-003", barcode: "4800123456015", name: "Earbuds", category: 4, brand: 4, cost: 200, price: 450, stock: 30, min: 8 },
    { sku: "ELC-004", barcode: "4800123456028", name: "Power Bank 10000mAh", category: 4, brand: 4, cost: 350, price: 699, stock: 25, min: 6 },
    { sku: "ELC-005", barcode: "4800123456029", name: "USB Hub 4-Port", category: 4, brand: 4, cost: 80, price: 159, stock: 45, min: 12 },
    { sku: "ELC-006", barcode: "4800123456030", name: "Mouse Wireless", category: 4, brand: 4, cost: 120, price: 249, stock: 35, min: 9 },
  ];

  for (const p of additionalProductDefs) {
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

  // ─── Additional Customers to reach higher count ───────────────────────────
  const additionalCustomerDefs = [
    { firstName: "Roberto", lastName: "Martinez", email: "roberto.martinez@email.com", phone: "+63 917 000 1011", address: "852 Oak St", city: "Manila", level: "BRONZE" },
    { firstName: "Carmen", lastName: "Lopez", email: "carmen.lopez@email.com", phone: "+63 917 000 1012", address: "963 Pine Ave", city: "Cebu", level: "SILVER" },
    { firstName: "Ricardo", lastName: "Gonzalez", email: "ricardo.gonzalez@email.com", phone: "+63 917 000 1013", address: "174 Elm Dr", city: "Davao", level: "GOLD" },
    { firstName: "Patricia", lastName: "Wilson", email: "patricia.wilson@email.com", phone: "+63 917 000 1014", address: "285 Maple Way", city: "Quezon City", level: "BRONZE" },
    { firstName: "Francisco", lastName: "Anderson", email: "francisco.anderson@email.com", phone: "+63 917 000 1015", address: "396 Cedar Ln", city: "Makati", level: "SILVER" },
    { firstName: "Laura", lastName: "Thomas", email: "laura.thomas@email.com", phone: "+63 917 000 1016", address: "417 Birch St", city: "Manila", level: "GOLD" },
    { firstName: "Daniel", lastName: "Jackson", email: "daniel.jackson@email.com", phone: "+63 917 000 1017", address: "528 Spruce Ave", city: "Cebu", level: "BRONZE" },
    { firstName: "Michelle", lastName: "White", email: "michelle.white@email.com", phone: "+63 917 000 1018", address: "639 Oak Dr", city: "Davao", level: "SILVER" },
    { firstName: "David", lastName: "Harris", email: "david.harris@email.com", phone: "+63 917 000 1019", address: "741 Pine Way", city: "Quezon City", level: "GOLD" },
    { firstName: "Sarah", lastName: "Martin", email: "sarah.martin@email.com", phone: "+63 917 000 1020", address: "852 Elm Ln", city: "Makati", level: "BRONZE" },
    { firstName: "James", lastName: "Garcia", email: "james.garcia@email.com", phone: "+63 917 000 1021", address: "963 Maple St", city: "Manila", level: "SILVER" },
    { firstName: "Jennifer", lastName: "Rodriguez", email: "jennifer.rodriguez@email.com", phone: "+63 917 000 1022", address: "174 Cedar Ave", city: "Cebu", level: "GOLD" },
    { firstName: "Robert", lastName: "Lewis", email: "robert.lewis@email.com", phone: "+63 917 000 1023", address: "285 Birch Dr", city: "Davao", level: "BRONZE" },
    { firstName: "Lisa", lastName: "Lee", email: "lisa.lee@email.com", phone: "+63 917 000 1024", address: "396 Spruce Way", city: "Quezon City", level: "SILVER" },
    { firstName: "Michael", lastName: "Walker", email: "michael.walker@email.com", phone: "+63 917 000 1025", address: "417 Oak Ln", city: "Makati", level: "GOLD" },
    { firstName: "Emily", lastName: "Hall", email: "emily.hall@email.com", phone: "+63 917 000 1026", address: "528 Pine St", city: "Manila", level: "BRONZE" },
    { firstName: "William", lastName: "Young", email: "william.young@email.com", phone: "+63 917 000 1027", address: "639 Elm Ave", city: "Cebu", level: "SILVER" },
    { firstName: "Ashley", lastName: "King", email: "ashley.king@email.com", phone: "+63 917 000 1028", address: "741 Maple Dr", city: "Davao", level: "GOLD" },
    { firstName: "Christopher", lastName: "Wright", email: "christopher.wright@email.com", phone: "+63 917 000 1029", address: "852 Cedar Way", city: "Quezon City", level: "BRONZE" },
    { firstName: "Jessica", lastName: "Scott", email: "jessica.scott@email.com", phone: "+63 917 000 1030", address: "963 Birch Ln", city: "Makati", level: "SILVER" },
  ];

  for (const c of additionalCustomerDefs) {
    const customer = await prisma.customer.create({
      data: { ...c, isActive: true },
    });
    customers.push(customer);
  }

  // ─── Additional Sales to reach higher count ───────────────────────────────
  const additionalSaleDefs = [
    { customerId: 10, totalAmount: 175, status: "COMPLETED", saleDate: new Date("2026-07-11T16:45:00") },
    { customerId: 11, totalAmount: 340, status: "COMPLETED", saleDate: new Date("2026-07-12T09:30:00") },
    { customerId: 12, totalAmount: 510, status: "COMPLETED", saleDate: new Date("2026-07-13T14:20:00") },
    { customerId: 13, totalAmount: 230, status: "COMPLETED", saleDate: new Date("2026-07-14T11:15:00") },
    { customerId: 14, totalAmount: 480, status: "COMPLETED", saleDate: new Date("2026-07-15T15:00:00") },
    { customerId: 15, totalAmount: 295, status: "COMPLETED", saleDate: new Date("2026-07-16T10:30:00") },
    { customerId: 16, totalAmount: 420, status: "COMPLETED", saleDate: new Date("2026-07-17T13:45:00") },
    { customerId: 17, totalAmount: 185, status: "COMPLETED", saleDate: new Date("2026-07-18T09:15:00") },
    { customerId: 18, totalAmount: 550, status: "COMPLETED", saleDate: new Date("2026-07-19T14:30:00") },
    { customerId: 19, totalAmount: 310, status: "COMPLETED", saleDate: new Date("2026-07-20T11:00:00") },
    { customerId: 20, totalAmount: 245, status: "COMPLETED", saleDate: new Date("2026-07-21T16:20:00") },
    { customerId: 21, totalAmount: 380, status: "COMPLETED", saleDate: new Date("2026-07-22T10:45:00") },
    { customerId: 22, totalAmount: 490, status: "COMPLETED", saleDate: new Date("2026-07-23T13:15:00") },
    { customerId: 23, totalAmount: 165, status: "COMPLETED", saleDate: new Date("2026-07-24T09:00:00") },
    { customerId: 24, totalAmount: 525, status: "COMPLETED", saleDate: new Date("2026-07-25T14:45:00") },
    { customerId: 25, totalAmount: 275, status: "COMPLETED", saleDate: new Date("2026-07-26T11:30:00") },
    { customerId: 26, totalAmount: 400, status: "COMPLETED", saleDate: new Date("2026-07-27T16:00:00") },
    { customerId: 27, totalAmount: 335, status: "COMPLETED", saleDate: new Date("2026-07-28T10:15:00") },
    { customerId: 28, totalAmount: 460, status: "COMPLETED", saleDate: new Date("2026-07-29T13:30:00") },
    { customerId: 29, totalAmount: 195, status: "COMPLETED", saleDate: new Date("2026-07-30T09:45:00") },
  ];

  for (const s of additionalSaleDefs) {
    const sale = await prisma.sale.create({
      data: {
        customerId: customers[s.customerId].id,
        totalAmount: s.totalAmount,
        status: s.status as any,
        saleDate: s.saleDate,
        cashierId: cashier.id,
      },
    });
    sales.push(sale);
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
  console.log(`Products: ${products.length} (30 total)`);
  console.log(`Suppliers: ${suppliers.length} (10 total)`);
  console.log(`Customers: ${customers.length} (30 total)`);
  console.log(`Expense Categories: ${expenseCategories.length} (8 total)`);
  console.log(`Expenses: ${expenses.length} (16 total)`);
  console.log(`Purchase Orders: ${purchaseOrders.length} (10 total)`);
  console.log(`Sales: ${sales.length} (30 total)`);
  console.log(`Activity Logs: ${activityDefs.length} (16 total)\n`);
}