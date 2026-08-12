import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Clearing database...");
  
  // Delete in reverse order of dependencies
  await prisma.inventoryTransaction.deleteMany();
  await prisma.loyaltyTransaction.deleteMany();
  await prisma.customerMembership.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.category.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.report.deleteMany();
  await prisma.forecastHistory.deleteMany();
  await prisma.aiRecommendation.deleteMany();
  await prisma.expenseCategory.deleteMany();
  
  console.log("✅ Database cleared successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Database clear failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });