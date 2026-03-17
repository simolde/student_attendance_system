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
    sectionAttendanceRaw,
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
    prisma.attendance.groupBy({
      by: ["studentId"],
      where: {
        date: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      _count: {
        studentId: true,
      },
    }),
  ]);

  const studentsToday = await prisma.student.findMany({
    where: {
      id: {
        in: sectionAttendanceRaw.map((item) => item.studentId),
      },
    },
    include: {
      section: true,
    },
  });

  const sectionMap = new Map<string, number>();

  for (const student of studentsToday) {
    const sectionName = student.section?.name ?? "No Section";
    sectionMap.set(sectionName, (sectionMap.get(sectionName) ?? 0) + 1);
  }

  const attendanceStatusData = [
    { name: "Present", value: presentToday },
    { name: "Late", value: lateToday },
    { name: "Absent", value: absentToday },
    { name: "Excused", value: excusedToday },
  ];

  const sectionAttendanceData = Array.from(sectionMap.entries()).map(
    ([name, total]) => ({
      name,
      total,
    })
  );

  return {
    totalUsers,
    totalStudents,
    totalSections,
    presentToday,
    lateToday,
    absentToday,
    excusedToday,
    today: startOfDay.toISOString().slice(0, 10),
    attendanceStatusData,
    sectionAttendanceData,
  };
}