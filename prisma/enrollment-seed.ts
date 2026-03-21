import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const activeSchoolYear = await prisma.schoolYear.findFirst({
    where: { isActive: true },
    select: { id: true, name: true },
  });

  if (!activeSchoolYear) {
    throw new Error("No active school year found. Create one first.");
  }

  const students = await prisma.student.findMany({
    where: {
      sectionId: { not: null },
    },
    select: {
      id: true,
      studentNo: true,
      sectionId: true,
    },
  });

  console.log(
    `Found ${students.length} students with existing section assignments for school year ${activeSchoolYear.name}.`
  );

  let created = 0;
  let skipped = 0;

  for (const student of students) {
    if (!student.sectionId) {
      skipped++;
      continue;
    }

    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_schoolYearId: {
          studentId: student.id,
          schoolYearId: activeSchoolYear.id,
        },
      },
      select: { id: true },
    });

    if (existingEnrollment) {
      skipped++;
      continue;
    }

    await prisma.enrollment.create({
      data: {
        studentId: student.id,
        schoolYearId: activeSchoolYear.id,
        sectionId: student.sectionId,
        status: "ENROLLED",
      },
    });

    created++;
    console.log(`Created enrollment for ${student.studentNo}`);
  }

  console.log(`Done. Created: ${created}, Skipped: ${skipped}`);
}

main()
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });