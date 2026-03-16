import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
  const hashedPassword = await bcrypt.hash("sistech@2103", 12);

  await prisma.user.upsert({
    where: { email: "mis@starland.edu.ph" },
    update: {},
    create: {
      name: "System Admin",
      email: "mis@starland.edu.ph",
      password: hashedPassword,
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  console.log("Admin user created");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });