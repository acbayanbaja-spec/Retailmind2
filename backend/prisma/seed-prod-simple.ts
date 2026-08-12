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

// Helper arrays for generating realistic data
const firstNames = [
  "Juan", "Maria", "Jose", "Ana", "Carlos", "Elena", "Miguel", "Sofia", "Antonio", "Isabella",
  "Francisco", "Carmen", "Luis", "Laura", "Javier", "Patricia", "Diego", "Valentina", "Pedro", "Daniela",
  "Rafael", "Gabriela", "Manuel", "Andrea", "Alejandro", "Natalia", "Fernando", "Monica", "Ricardo", "Victoria",
  "Sergio", "Claudia", "Andres", "Paula", "Julio", "Veronica", "Alberto", "Sandra", "Roberto", "Elena",
  "Ramon", "Beatriz", "Daniel", "Carolina", "Adrian", "Marina", "Jorge", "Luisa", "Oscar", "Teresa",
  "Edgar", "Alicia", "Victor", "Cristina", "Raul", "Silvia", "Ernesto", "Eva", "Samuel", "Lorena",
  "Benjamin", "Rosa", "Nicolas", "Angela", "Julian", "Diana", "Leonardo", "Sara", "Maximiliano", "Camila",
  "Sebastian", "Valeria", "Tomas", "Lucia", "Martin", "Ana", "Bruno", "Sofia", "Iker", "Marta",
  "Dylan", "Julia", "Thiago", "Carla", "Leo", "Ines", "Ian", "Clara", "Noah", "Adriana"
];

const lastNames = [
  "Garcia", "Rodriguez", "Martinez", "Lopez", "Gonzalez", "Perez", "Sanchez", "Ramirez", "Cruz", "Flores",
  "Torres", "Rivera", "Morales", "Reyes", "Jimenez", "Mendoza", "Castillo", "Ramos", "Ortiz", "Delgado",
  "Vargas", "Castro", "Silva", "Mendoza", "Paredes", "Cortez", "Santos", "Vega", "Rojas", "Mendoza",
  "Herrera", "Luna", "Guzman", "Rios", "Fernandez", "Medina", "Diaz", "Palacios", "Navarro", "Romero",
  "Velasquez", "Cabrera", "Soto", "Mendoza", "Peralta", "Gomez", "Solis", "Benitez", "Molina", "Castillo",
  "Quintero", "Menendez", "Cervantes", "Salazar", "Villanueva", "Pacheco", "Bautista", "Mercado", "Valdez", "Lara",
  "Dominguez", "Aguilar", "Peña", "Ibarra", "Cantu", "Galindo", "Reyes", "Mendoza", "Serrano", "Quiroz",
  "Macias", "Gonzalez", "Pimentel", "Trevino", "Zuniga", "Valenzuela", "Delacruz", "Mejia", "Luna", "Esparza"
];

const cities = [
  "Manila", "Quezon City", "Caloocan", "Makati", "Pasig", "Taguig", "Parañaque", "Las Piñas", "Muntinlupa", "Marikina",
  "Valenzuela", "Malabon", "Navotas", "San Juan", "Mandaluyong", "Pasay", "Cebu City", "Davao City", "Baguio City", "Iloilo City",
  "Zamboanga City", "Antipolo", "Cagayan de Oro", "General Santos", "Bacolod", "Angeles City", "Batangas City", "Dagupan", "Lipa City", "Legazpi"
];

const streets = [
  "Rizal Avenue", "Mabini Street", "Bonifacio Street", "Luna Street", "Magsaysay Avenue", "Quezon Street", "Aquino Street",
  "Santos Street", "Reyes Street", "Garcia Street", "Cruz Street", "Mendoza Street", "Ramos Street", "Flores Street",
  "Del Rosario Street", "Castillo Street", "Villanueva Street", "Santos Street", "Mercado Street", "Valdez Street",
  "Lara Street", "Dominguez Street", "Aguilar Street", "Peña Street", "Ibarra Street", "Cantu Street", "Galindo Street"
];

const supplierNames = [
  "Metro Wholesale Supply", "Pacific Goods Trading", "Luzon Distributors Inc", "Visayas Trading Co", "Mindanao Suppliers",
  "National Food Corp", "Philippine Products Inc", "Asian Wholesale Solutions", "Global Import Export", "Regional Distribution",
  "Manila Trading Post", "Cebu Commercial Hub", "Davao Business Supply", "Baguio Market Distributors", "Iloilo Trading Partners",
  "Zamboanga Wholesale Co", "Antipolo Suppliers Inc", "Cagayan de Oro Trading", "General Santos Distribution", "Bacolod Business Partners",
  "Angeles City Supply Co", "Batangas Commercial Inc", "Dagupan Trading House", "Lipa City Distributors", "Legazpi Business Solutions",
  "Premium Goods Corp", "Elite Trading Partners", "Superior Supply Chain", "Prime Distribution Inc", "Master Wholesalers Co",
  "Quality Products Inc", "Standard Trading Solutions", "Central Distribution Hub", "Universal Supply Partners", "Global Wholesale Network",
  "Pacific Rim Trading", "Asian Market Solutions", "International Business Partners", "World Wide Distributors", "Global Supply Chain Inc",
  "Philippine Trading Corp", "National Business Solutions", "Regional Wholesale Partners", "Local Distribution Co", "Community Supply Hub",
  "Metro Manila Trading", "Luzon Business Partners", "Visayas Commercial Inc", "Mindanao Wholesale Solutions", "National Distribution Network"
];

const contactPersons = [
  "Roberto Cruz", "Lisa Tan", "Miguel Santos", "Ana Garcia", "Carlos Mendoza", "Elena Rodriguez", "Jose Martinez", "Maria Lopez",
  "Juan Gonzalez", "Carmen Perez", "Antonio Sanchez", "Patricia Ramirez", "Francisco Cruz", "Sofia Flores", "Luis Torres", "Laura Rivera",
  "Javier Morales", "Monica Reyes", "Diego Jimenez", "Valentina Mendoza", "Pedro Castillo", "Daniela Ramos", "Rafael Ortiz", "Gabriela Delgado",
  "Manuel Vargas", "Andrea Castro", "Alejandro Silva", "Natalia Paredes", "Fernando Cortez", "Sandra Santos", "Sergio Vega", "Claudia Rojas",
  "Andres Morales", "Paula Herrera", "Julio Luna", "Veronica Guzman", "Alberto Rios", "Sandra Fernandez", "Roberto Medina", "Elena Diaz",
  "Ramon Palacios", "Beatriz Navarro", "Daniel Romero", "Carolina Velasquez", "Adrian Cabrera", "Marina Soto", "Jorge Mendoza", "Luisa Peralta",
  "Oscar Gomez", "Teresa Solis", "Edgar Benitez", "Alicia Molina", "Victor Castillo", "Cristina Quintero", "Raul Menendez", "Silvia Cervantes",
  "Ernesto Salazar", "Eva Villanueva", "Samuel Pacheco", "Lorena Bautista", "Benjamin Mercado", "Rosa Valdez", "Nicolas Lara", "Angela Dominguez",
  "Julian Aguilar", "Diana Peña", "Leonardo Ibarra", "Sara Cantu", "Maximiliano Galindo", "Camila Reyes", "Sebastian Mendoza", "Valeria Serrano",
  "Tomas Quiroz", "Lucia Macias", "Martin Gonzalez", "Ana Pimentel", "Bruno Trevino", "Sofia Zuniga", "Iker Valenzuela", "Marta Delacruz",
  "Dylan Mejia", "Julia Luna", "Thiago Esparza", "Carla Reyes", "Leo Mendoza", "Ines Santos", "Ian Garcia", "Clara Rodriguez", "Noah Martinez", "Adriana Lopez"
];

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomPhone(): string {
  return `+63 9${Math.floor(Math.random() * 9) + 1} ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 9000) + 1000}`;
}

function getRandomEmail(firstName: string, lastName: string): string {
  const domains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "email.com"];
  const domain = getRandomItem(domains);
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 100)}@${domain}`;
}

function getRandomAddress(): string {
  const street = getRandomItem(streets);
  const number = Math.floor(Math.random() * 999) + 1;
  return `${number} ${street}`;
}

const PROD_PASSWORD = process.env.ADMIN_PASSWORD || "AdminPassword123!";

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function main() {
  console.log("Seeding RetailMind PRODUCTION database...\n");

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

  // ─── Suppliers ───────────────────────────────────────────────────────────
  const suppliers = [];
  
  // Generate 50 suppliers (reduced from 100 for faster seeding)
  for (let i = 0; i < 50; i++) {
    const name = getRandomItem(supplierNames);
    const contactPerson = getRandomItem(contactPersons);
    const email = `contact${i}@${name.toLowerCase().replace(/\s+/g, '')}.dev`;
    const phone = `+63 2 ${Math.floor(Math.random() * 9000) + 1000} ${Math.floor(Math.random() * 9000) + 1000}`;
    const address = getRandomAddress();
    const city = getRandomItem(cities);
    
    // Check if supplier with this email already exists
    const existing = await prisma.supplier.findFirst({
      where: { email, deletedAt: null }
    });
    
    let supplier;
    
    if (existing) {
      supplier = existing;
    } else {
      supplier = await prisma.supplier.create({
        data: {
          name,
          contactPerson,
          email,
          phone,
          address,
          city,
        },
      });
    }
    
    suppliers.push(supplier);
  }

  // ─── Products ────────────────────────────────────────────────────────────
  const productDefs = [
    { sku: "BEV-001", barcode: "4800123456001", name: "Bottled Water 500ml", category: 0, brand: 0, supplier: 0, cost: 8, price: 15, stock: 200, min: 50 },
    { sku: "BEV-002", barcode: "4800123456002", name: "Energy Drink 250ml", category: 0, brand: 2, supplier: 0, cost: 25, price: 45, stock: 80, min: 20 },
    { sku: "BEV-003", barcode: "4800123456003", name: "Soda 330ml", category: 0, brand: 0, supplier: 1, cost: 12, price: 22, stock: 150, min: 40 },
    { sku: "BEV-004", barcode: "4800123456004", name: "Iced Tea 500ml", category: 0, brand: 2, supplier: 0, cost: 18, price: 32, stock: 100, min: 25 },
    { sku: "BEV-005", barcode: "4800123456005", name: "Orange Juice 1L", category: 0, brand: 0, supplier: 1, cost: 35, price: 65, stock: 60, min: 15 },
    { sku: "SNK-001", barcode: "4800123456006", name: "Potato Chips 150g", category: 1, brand: 0, supplier: 1, cost: 35, price: 55, stock: 120, min: 30 },
    { sku: "SNK-002", barcode: "4800123456007", name: "Chocolate Bar 40g", category: 1, brand: 0, supplier: 1, cost: 18, price: 30, stock: 150, min: 40 },
    { sku: "SNK-003", barcode: "4800123456008", name: "Cookies 200g", category: 1, brand: 0, supplier: 0, cost: 25, price: 45, stock: 90, min: 25 },
    { sku: "SNK-004", barcode: "4800123456009", name: "Crackers 100g", category: 1, brand: 2, supplier: 1, cost: 15, price: 28, stock: 110, min: 30 },
    { sku: "SNK-005", barcode: "4800123456010", name: "Candy Pack 50g", category: 1, brand: 0, supplier: 0, cost: 12, price: 22, stock: 200, min: 50 },
    { sku: "PC-001", barcode: "4800123456011", name: "Shampoo 180ml", category: 2, brand: 1, supplier: 0, cost: 65, price: 99, stock: 60, min: 15 },
    { sku: "PC-002", barcode: "4800123456012", name: "Toothpaste 150g", category: 2, brand: 3, supplier: 0, cost: 45, price: 75, stock: 90, min: 25 },
    { sku: "PC-003", barcode: "4800123456013", name: "Soap Bar 90g", category: 2, brand: 1, supplier: 1, cost: 25, price: 45, stock: 150, min: 40 },
    { sku: "PC-004", barcode: "4800123456014", name: "Lotion 200ml", category: 2, brand: 3, supplier: 0, cost: 85, price: 145, stock: 70, min: 18 },
    { sku: "PC-005", barcode: "4800123456015", name: "Deodorant 50ml", category: 2, brand: 1, supplier: 1, cost: 55, price: 95, stock: 80, min: 20 },
    { sku: "HH-001", barcode: "4800123456016", name: "Dish Soap 500ml", category: 3, brand: 1, supplier: 1, cost: 55, price: 85, stock: 45, min: 15 },
    { sku: "HH-002", barcode: "4800123456017", name: "Laundry Detergent 1kg", category: 3, brand: 3, supplier: 1, cost: 120, price: 175, stock: 35, min: 10 },
    { sku: "HH-003", barcode: "4800123456018", name: "Bleach 1L", category: 3, brand: 1, supplier: 0, cost: 35, price: 65, stock: 60, min: 15 },
    { sku: "HH-004", barcode: "4800123456019", name: "Toilet Cleaner 750ml", category: 3, brand: 3, supplier: 1, cost: 45, price: 85, stock: 50, min: 12 },
    { sku: "HH-005", barcode: "4800123456020", name: "Glass Cleaner 500ml", category: 3, brand: 1, supplier: 0, cost: 40, price: 75, stock: 55, min: 14 },
    { sku: "ELC-001", barcode: "4800123456021", name: "USB-C Cable 1m", category: 4, brand: 4, supplier: 0, cost: 80, price: 149, stock: 25, min: 8 },
    { sku: "ELC-002", barcode: "4800123456022", name: "Wireless Earbuds", category: 4, brand: 4, supplier: 0, cost: 450, price: 799, stock: 12, min: 5 },
    { sku: "ELC-003", barcode: "4800123456023", name: "Phone Case", category: 4, brand: 4, supplier: 1, cost: 65, price: 125, stock: 40, min: 10 },
    { sku: "ELC-004", barcode: "4800123456024", name: "Screen Protector", category: 4, brand: 4, supplier: 0, cost: 25, price: 55, stock: 80, min: 20 },
    { sku: "ELC-005", barcode: "4800123456025", name: "Charging Cable 2m", category: 4, brand: 4, supplier: 1, cost: 45, price: 89, stock: 35, min: 10 },
  ];

  const products = [];
  for (const p of productDefs) {
    // Check if product with this SKU or barcode already exists
    const existingBySku = await prisma.product.findFirst({
      where: { sku: p.sku, deletedAt: null }
    });
    
    const existingByBarcode = p.barcode ? await prisma.product.findFirst({
      where: { barcode: p.barcode, deletedAt: null }
    }) : null;

    let product;
    
    if (existingBySku) {
      // Update existing product by SKU, but check barcode conflict
      let barcodeToUse = p.barcode;
      
      // If the existing product has a different barcode and our desired barcode is taken by another product
      if (existingByBarcode && existingByBarcode.id !== existingBySku.id) {
        console.log(`⚠️  Skipping barcode update for ${p.sku} - barcode ${p.barcode} already exists on another product`);
        barcodeToUse = existingBySku.barcode; // Keep existing barcode
      }
      
      product = await prisma.product.update({
        where: { id: existingBySku.id },
        data: {
          ...(barcodeToUse && barcodeToUse !== existingBySku.barcode ? { barcode: barcodeToUse } : {}),
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
    } else if (existingByBarcode) {
      // Skip if barcode exists but different SKU (avoid duplicates)
      console.log(`⚠️  Skipping product ${p.sku} - barcode ${p.barcode} already exists`);
      continue;
    } else {
      // Create new product
      product = await prisma.product.create({
        data: {
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
    }

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
    products.push(product);
  }

  // ─── Customers ───────────────────────────────────────────────────────────
  const customerDefs = [];
  
  // Generate 50 customers (reduced from 100 for faster seeding)
  for (let i = 0; i < 50; i++) {
    const firstName = getRandomItem(firstNames);
    const lastName = getRandomItem(lastNames);
    const email = getRandomEmail(firstName, lastName);
    const phone = getRandomPhone();
    const city = getRandomItem(cities);
    const address = getRandomAddress();
    
    // Random membership level with weighted distribution
    const membershipRand = Math.random();
    let level: MembershipLevel;
    let points: number;
    
    if (membershipRand < 0.1) {
      level = MembershipLevel.PLATINUM;
      points = Math.floor(Math.random() * 2000) + 1000;
    } else if (membershipRand < 0.3) {
      level = MembershipLevel.GOLD;
      points = Math.floor(Math.random() * 800) + 500;
    } else if (membershipRand < 0.6) {
      level = MembershipLevel.SILVER;
      points = Math.floor(Math.random() * 400) + 200;
    } else {
      level = MembershipLevel.BRONZE;
      points = Math.floor(Math.random() * 150) + 50;
    }
    
    customerDefs.push({
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      level,
      points
    });
  }
  
  // Add a walk-in customer
  customerDefs.push({
    firstName: "Walk-in",
    lastName: "Customer",
    email: null,
    phone: null,
    address: null,
    city: null,
    level: MembershipLevel.BRONZE,
    points: 0
  });

  const customers = [];
  for (const c of customerDefs) {
    let customer;
    
    if (c.email) {
      const existing = await prisma.customer.findFirst({
        where: { email: c.email, deletedAt: null }
      });
      
      if (existing) {
        customer = existing;
      } else {
        customer = await prisma.customer.create({
          data: {
            firstName: c.firstName,
            lastName: c.lastName,
            email: c.email,
            phone: c.phone,
            address: c.address,
            city: c.city,
            totalSpent: 0,
          },
        });
      }
    } else {
      // For walk-in customer, find or create
      const existing = await prisma.customer.findFirst({
        where: { 
          firstName: c.firstName, 
          lastName: c.lastName, 
          email: null,
          deletedAt: null 
        }
      });
      
      if (existing) {
        customer = existing;
      } else {
        customer = await prisma.customer.create({
          data: {
            firstName: c.firstName,
            lastName: c.lastName,
            totalSpent: 0,
          },
        });
      }
    }

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

  // ─── Purchase Orders ──────────────────────────────────────────────────────
  const poNumbers = ["PO-2026-0001", "PO-2026-0002", "PO-2026-0003"];
  let createdPOs = 0;
  
  for (let poIndex = 0; poIndex < poNumbers.length; poIndex++) {
    const poNumber = poNumbers[poIndex];
    const existingPo = await prisma.purchaseOrder.findUnique({ where: { orderNumber: poNumber } });

    if (!existingPo) {
      const poItems = products.slice(poIndex * 5, (poIndex + 1) * 5).map((p) => {
        const quantity = Math.floor(Math.random() * 50) + 20;
        return {
          productId: p.id,
          quantity,
          unitCost: Number(p.costPrice),
          totalCost: Number(p.costPrice) * quantity,
        };
      });

      const statuses = [PurchaseOrderStatus.APPROVED, PurchaseOrderStatus.RECEIVED, PurchaseOrderStatus.PENDING];
      
      await prisma.purchaseOrder.create({
        data: {
          orderNumber: poNumber,
          supplierId: suppliers[poIndex % suppliers.length].id,
          status: statuses[poIndex],
          totalAmount: poItems.reduce((sum, i) => sum + i.totalCost, 0),
          notes: `Restock order for products ${poIndex * 5 + 1}-${(poIndex + 1) * 5}`,
          createdById: manager.id,
          items: { create: poItems },
        },
      });
      createdPOs++;
    }
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

  console.log("✅ Seed completed successfully.\n");
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
  console.log(`Suppliers: ${suppliers.length}`);
  console.log(`Products: ${products.length}`);
  console.log(`Customers: ${customers.length}`);
  console.log(`Purchase Orders: ${createdPOs}\n`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });