import app from "./app";
import { env } from "./config/env";
import prisma from "./lib/prisma";
import { seedDatabase } from "./lib/seed";

const PORT = env.PORT;
const HOST = "0.0.0.0";

async function ensureDatabaseSeeded() {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log("🌱 Database is empty. Running auto-seed...");
      await seedDatabase(); // Don't force seed on startup
      console.log("✅ Auto-seed completed successfully.");
    } else {
      console.log(`✅ Database already has ${userCount} users. Skipping auto-seed.`);
    }
  } catch (error) {
    console.error("❌ Auto-seed failed:", error);
    // Don't fail startup if seeding fails - let the server start anyway
  }
}

const server = app.listen(PORT, HOST, async () => {
  console.log(`RetailMind API running on http://${HOST}:${PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log(`Health check: http://${HOST}:${PORT}/api/health`);
  
  // Auto-seed database if empty
  await ensureDatabaseSeeded();
});

function gracefulShutdown(signal: string) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log("HTTP server closed.");
    process.exit(0);
  });

  setTimeout(() => {
    console.error("Forced shutdown after timeout.");
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export default server;
