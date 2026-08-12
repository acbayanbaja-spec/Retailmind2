import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const NEW_PASSWORD = "DevPassword123!";

async function main() {
  console.log("Updating user passwords to:", NEW_PASSWORD);

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
  console.log(`New password for all users: ${NEW_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error("❌ Password update failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });