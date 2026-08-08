import app from "./app";
import { env } from "./config/env";
import prisma from "./lib/prisma";

const PORT = env.PORT;
const HOST = "0.0.0.0";

const server = app.listen(PORT, HOST, () => {
  console.log(`RetailMind API running on http://${HOST}:${PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log(`Health check: http://${HOST}:${PORT}/api/health`);
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
