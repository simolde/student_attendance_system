import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
  const hashedPassword = await bcrypt.hash("sample", 12);

  await prisma.user.upsert({
    where: { email: "sample@starland.edu.ph" },
    update: {},
    create: {
      name: "Sample Account",
      email: "sample@starland.edu.ph",
      password: hashedPassword,
      role: "TEACHER",
      isActive: true,
    },
  });

  console.log("Teacher user created");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });