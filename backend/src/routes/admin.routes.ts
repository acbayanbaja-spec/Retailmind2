import { Router } from "express";
import { authenticate, requirePermission } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { seedDatabase } from "../lib/seed";
import bcrypt from "bcryptjs";

const router = Router();

router.use(authenticate);
router.use(requirePermission("users.manage"));

// Temporary endpoint to trigger database seeding
router.post("/seed-minimal", async (req, res) => {
  try {
    await seedDatabase();
    
    const PROD_PASSWORD = process.env.ADMIN_PASSWORD || "DevPassword123!";
    
    res.json({ 
      success: true, 
      message: "Database seeded successfully with minimal data (5 products, 3 users, etc.)",
      note: "This is a temporary endpoint for database seeding. Remove after production setup.",
      credentials: {
        password: PROD_PASSWORD,
        users: {
          admin: "admin@retailmind.dev",
          manager: "manager@retailmind.dev", 
          cashier: "cashier@retailmind.dev"
        }
      }
    });
    
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to seed database",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Temporary endpoint to update all user passwords
router.post("/update-passwords", async (req, res) => {
  try {
    const NEW_PASSWORD = process.env.ADMIN_PASSWORD || "DevPassword123!";
    
    const passwordHash = await bcrypt.hash(NEW_PASSWORD, 12);

    const users = await prisma.user.findMany({
      where: { deletedAt: null }
    });

    console.log(`Found ${users.length} users to update`);

    for (const user of users) {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash }
      });
      console.log(`✅ Updated password for ${user.email}`);
    }

    console.log("\n✅ All passwords updated successfully!");
    
    res.json({ 
      success: true, 
      message: `Updated passwords for ${users.length} users`,
      newPassword: NEW_PASSWORD,
      note: "This is a temporary endpoint for password updates. Remove after production setup."
    });
    
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update passwords",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;