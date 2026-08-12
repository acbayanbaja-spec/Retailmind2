import { Router } from "express";
import authRoutes from "./auth.routes";
import dashboardRoutes from "./dashboard.routes";
import healthRoutes from "./health.routes";
import inventoryRoutes from "./inventory.routes";
import customerRoutes from "./customer.routes";
import productRoutes from "./product.routes";
import expenseRoutes from "./expense.routes";
import purchaseOrderRoutes from "./purchase-order.routes";
import reportRoutes from "./report.routes";
import analyticsRoutes from "./analytics.routes";
import auditRoutes from "./audit.routes";
import saleRoutes from "./sale.routes";
import settingRoutes from "./setting.routes";
import supplierRoutes from "./supplier.routes";
import userRoutes from "./user.routes";
import adminRoutes from "./admin.routes";

const router = Router();

router.use("/", healthRoutes);
router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/products", productRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/sales", saleRoutes);
router.use("/customers", customerRoutes);
router.use("/suppliers", supplierRoutes);
router.use("/purchase-orders", purchaseOrderRoutes);
router.use("/expenses", expenseRoutes);
router.use("/reports", reportRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/audit-logs", auditRoutes);
router.use("/users", userRoutes);
router.use("/admin", adminRoutes);
router.use("/settings", settingRoutes);

export default router;
