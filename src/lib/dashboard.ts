import { prisma } from "@/lib/prisma";

export async function getDashboardStats() {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const [
    totalUsers,
    totalStudents,
    totalSections,
    presentToday,
    lateToday,
    absentToday,
    excusedToday,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.student.count(),
    prisma.section.count(),
    prisma.attendance.count({
      where: {
        date: {
          gte: startOfDay,
          lt: endOfDay,
        },
        status: "PRESENT",
      },
    }),
    prisma.attendance.count({
      where: {
        date: {
          gte: startOfDay,
          lt: endOfDay,
        },
        status: "LATE",
      },
    }),
    prisma.attendance.count({
      where: {
        date: {
          gte: startOfDay,
          lt: endOfDay,
        },
        status: "ABSENT",
      },
    }),
    prisma.attendance.count({
      where: {
        date: {
          gte: startOfDay,
          lt: endOfDay,
        },
        status: "EXCUSED",
      },
    }),
  ]);

  return {
    totalUsers,
    totalStudents,
    totalSections,
    presentToday,
    lateToday,
    absentToday,
    excusedToday,
    today: startOfDay.toISOString().slice(0, 10),
  };
}