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
    throw new Error("No active school year found. Create or activate one first.");
  }

  const attendanceRows = await prisma.attendance.findMany({
    where: {
      enrollmentId: null,
    },
    select: {
      id: true,
      studentId: true,
      date: true,
    },
    orderBy: {
      date: "asc",
    },
  });

  console.log(
    `Found ${attendanceRows.length} attendance record(s) without enrollmentId for active school year ${activeSchoolYear.name}.`
  );

  let updated = 0;
  let skipped = 0;
  let missing = 0;

  for (const row of attendanceRows) {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_schoolYearId: {
          studentId: row.studentId,
          schoolYearId: activeSchoolYear.id,
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!enrollment) {
      missing++;
      console.log(
        `No enrollment found for attendance ${row.id} (studentId: ${row.studentId})`
      );
      continue;
    }

    if (enrollment.status !== "ENROLLED") {
      skipped++;
      console.log(
        `Skipped attendance ${row.id} because enrollment is ${enrollment.status}`
      );
      continue;
    }

    await prisma.attendance.update({
      where: { id: row.id },
      data: {
        enrollmentId: enrollment.id,
      },
    });

    updated++;
    console.log(`Updated attendance ${row.id}`);
  }

  console.log(`Done.`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Missing enrollment: ${missing}`);
}

main()
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });