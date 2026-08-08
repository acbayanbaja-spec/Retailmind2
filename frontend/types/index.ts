export type UserRole = "ADMINISTRATOR" | "STORE_MANAGER" | "CASHIER";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
}

export interface Employee {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string | null;
  role: UserRole;
  roleId: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoleOption {
  id: string;
  name: UserRole;
  description: string | null;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  isPublic: boolean;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRole;
  permissions: string[];
  lastLoginAt: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface NavItem {
  title: string;
  href: string;
  roles?: UserRole[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardSummary {
  todayRevenue: number;
  todaySalesCount: number;
  todayRevenueChange: number;
  todaySalesChange: number;
  totalProducts: number;
  activeCustomers: number;
  lowStockCount: number;
  monthRevenue: number;
  monthExpenses: number;
}

export interface DashboardSalesTrendPoint {
  date: string;
  revenue: number;
  salesCount: number;
}

export interface DashboardTopProduct {
  productId: string;
  name: string;
  quantitySold: number;
  revenue: number;
}

export interface DashboardPaymentBreakdown {
  method: "CASH" | "GCASH" | "CARD";
  amount: number;
  count: number;
}

export interface DashboardLowStockProduct {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minStock: number;
}

export interface DashboardActivityItem {
  id: string;
  action: string;
  description: string;
  createdAt: string;
  userName: string | null;
}

export interface DashboardOverview {
  summary: DashboardSummary;
  salesTrend: DashboardSalesTrendPoint[];
  topProducts: DashboardTopProduct[];
  paymentBreakdown: DashboardPaymentBreakdown[];
  lowStockProducts: DashboardLowStockProduct[];
  recentActivity: DashboardActivityItem[];
}

export type ProductStatus = "ACTIVE" | "INACTIVE" | "DISCONTINUED";

export interface CatalogOption {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  description: string | null;
  categoryId: string;
  brandId: string | null;
  supplierId: string | null;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  minStock: number;
  maxStock: number | null;
  status: ProductStatus;
  isLowStock: boolean;
  category: CatalogOption;
  brand: CatalogOption | null;
  supplier: CatalogOption | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryRow {
  productId: string;
  sku: string;
  name: string;
  categoryName: string;
  currentStock: number;
  minStock: number;
  maxStock: number | null;
  status: ProductStatus;
  isLowStock: boolean;
  location: string;
  lastRestockedAt: string | null;
}

export interface InventorySummary {
  totalSkus: number;
  lowStockCount: number;
  totalUnits: number;
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  type: "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT" | "SALE" | "RETURN" | "PURCHASE" | "EXPIRED";
  quantity: number;
  previousQty: number;
  newQty: number;
  notes: string | null;
  performedByName: string | null;
  createdAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type PaymentMethod = "CASH" | "GCASH" | "CARD";

export type SaleStatus =
  | "COMPLETED"
  | "PENDING"
  | "CANCELLED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export interface PosProduct {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  sellingPrice: number;
  currentStock: number;
  categoryName: string;
  inStock: boolean;
}

export interface CartItem {
  productId: string;
  sku: string;
  name: string;
  unitPrice: number;
  quantity: number;
  maxStock: number;
}

export interface SalePayment {
  id: string;
  method: PaymentMethod;
  amount: number;
  status: string;
  referenceNo: string | null;
  paidAt: string;
}

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  totalPrice: number;
}

export interface Sale {
  id: string;
  saleNumber: string;
  customerId: string | null;
  cashierId: string;
  status: SaleStatus;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  loyaltyPointsEarned: number;
  notes: string | null;
  completedAt: string | null;
  createdAt: string;
  customer: { id: string; name: string; email: string | null } | null;
  cashierName: string;
  items: SaleItem[];
  payments: SalePayment[];
}

export type MembershipLevel = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";

export interface CustomerMembership {
  level: MembershipLevel;
  loyaltyPoints: number;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  totalSpent: number;
  isActive: boolean;
  membership: CustomerMembership | null;
  salesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerDetail extends Customer {
  recentSales: {
    id: string;
    saleNumber: string;
    totalAmount: number;
    completedAt: string | null;
    createdAt: string;
  }[];
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  notes: string | null;
  isActive: boolean;
  productCount: number;
  purchaseOrderCount: number;
  createdAt: string;
  updatedAt: string;
}

export type PurchaseOrderStatus =
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "ORDERED"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "CANCELLED";

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  receivedQty: number;
  remainingQty: number;
  unitCost: number;
  totalCost: number;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  status: PurchaseOrderStatus;
  totalAmount: number;
  notes: string | null;
  orderedAt: string | null;
  receivedAt: string | null;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  items: PurchaseOrderItem[];
  totalOrderedQty: number;
  totalReceivedQty: number;
}

export interface PoProductOption {
  id: string;
  sku: string;
  name: string;
  costPrice: number;
  currentStock: number;
  minStock: number;
  isLowStock: boolean;
}

export type ExpenseRecurrence =
  | "NONE"
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "YEARLY";

export interface ExpenseCategory {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  expenseCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  categoryId: string;
  categoryName: string;
  title: string;
  amount: number;
  description: string | null;
  expenseDate: string;
  recurrence: ExpenseRecurrence;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseSummary {
  month: string;
  totalAmount: number;
  expenseCount: number;
  recurringCount: number;
  byCategory: {
    categoryId: string;
    categoryName: string;
    totalAmount: number;
    expenseCount: number;
  }[];
}

export type ReportGroupBy = "day" | "week" | "month";

export interface BusinessReportFinancial {
  revenue: number;
  expenses: number;
  netProfit: number;
  profitMargin: number;
  salesCount: number;
  expenseCount: number;
  averageOrderValue: number;
  revenueChange: number;
  expensesChange: number;
  netProfitChange: number;
  salesCountChange: number;
}

export interface BusinessReportExpenseBreakdown {
  categoryId: string;
  categoryName: string;
  totalAmount: number;
  expenseCount: number;
}

export interface BusinessReportInventoryCategory {
  categoryName: string;
  skuCount: number;
  units: number;
  retailValue: number;
}

export interface BusinessReportInventory {
  totalSkus: number;
  totalUnits: number;
  retailValue: number;
  costValue: number;
  potentialProfit: number;
  lowStockCount: number;
  lowStockProducts: DashboardLowStockProduct[];
  byCategory: BusinessReportInventoryCategory[];
}

export interface BusinessReport {
  period: {
    dateFrom: string;
    dateTo: string;
    groupBy: ReportGroupBy;
  };
  financial: BusinessReportFinancial;
  salesTrend: DashboardSalesTrendPoint[];
  paymentBreakdown: DashboardPaymentBreakdown[];
  topProducts: DashboardTopProduct[];
  expenseBreakdown: BusinessReportExpenseBreakdown[];
  inventory: BusinessReportInventory;
}

export type ForecastType = "SALES" | "DEMAND" | "REVENUE" | "SEASONAL";

export type RecommendationType =
  | "RESTOCK"
  | "BEST_SELLER"
  | "SLOW_MOVING"
  | "LOW_STOCK"
  | "HIGH_DEMAND"
  | "DECLINING_SALES"
  | "REORDER"
  | "INSIGHT";

export interface ForecastRecord {
  id: string;
  productId: string | null;
  productName: string | null;
  productSku: string | null;
  type: ForecastType;
  predictedValue: number;
  confidence: number | null;
  dataPeriodStart: string;
  dataPeriodEnd: string;
  forecastDate: string;
  explanation: string | null;
  createdAt: string;
}

export interface AiRecommendation {
  id: string;
  productId: string | null;
  productName: string | null;
  productSku: string | null;
  type: RecommendationType;
  title: string;
  description: string;
  recommendation: string;
  confidence: number | null;
  isRead: boolean;
  isDismissed: boolean;
  createdAt: string;
}

export interface AnalyticsOverview {
  hasData: boolean;
  lastGeneratedAt: string | null;
  unreadRecommendations: number;
  revenueForecast: ForecastRecord | null;
  demandForecasts: ForecastRecord[];
  recommendations: AiRecommendation[];
  revenueSeries: {
    historical: { date: string; revenue: number }[];
    projected: { date: string; revenue: number }[];
  };
}

export type ActivityAction =
  | "LOGIN"
  | "LOGOUT"
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "SALE"
  | "REFUND"
  | "INVENTORY_ADJUSTMENT"
  | "PURCHASE_ORDER"
  | "EXPENSE"
  | "PERMISSION_CHANGE"
  | "SETTINGS_CHANGE";

export interface AuditLogUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AuditLogEntry {
  id: string;
  action: ActivityAction;
  entityType: string | null;
  entityId: string | null;
  description: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: AuditLogUser | null;
}

export interface AuditLogListResponse {
  items: AuditLogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
