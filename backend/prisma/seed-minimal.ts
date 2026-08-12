// This file is now a wrapper that imports from the src/lib/seed.ts
// This allows both manual execution and TypeScript compliance
import { seedDatabase } from "../src/lib/seed";

// Check for --force flag
const forceSeed = process.argv.includes('--force');

seedDatabase(forceSeed)
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => {
    // Note: prisma disconnect is handled in seedDatabase
    process.exit(0);
  });