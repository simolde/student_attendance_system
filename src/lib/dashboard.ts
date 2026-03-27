import { prisma } from "@/lib/prisma";
import { dateInputToUtcDate, getManilaDateInputValue } from "@/lib/date";

export async function getDashboardStats() {
  const todayInput = getManilaDateInputValue();
  const todayDate = dateInputToUtcDate(todayInput);

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
        date: todayDate,
        status: "PRESENT",
      },
    }),
    prisma.attendance.count({
      where: {
        date: todayDate,
        status: "LATE",
      },
    }),
    prisma.attendance.count({
      where: {
        date: todayDate,
        status: "ABSENT",
      },
    }),
    prisma.attendance.count({
      where: {
        date: todayDate,
        status: "EXCUSED",
      },
    }),
    prisma.attendance.groupBy({
      by: ["studentId"],
      where: {
        date: todayDate,
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
    { name: "Present", value: Number(presentToday) },
    { name: "Late", value: Number(lateToday) },
    { name: "Absent", value: Number(absentToday) },
    { name: "Excused", value: Number(excusedToday) },
  ];

  const sectionAttendanceData = Array.from(sectionMap.entries()).map(
    ([name, total]) => ({
      name,
      total: Number(total),
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
    today: todayInput,
    attendanceStatusData,
    sectionAttendanceData,
  };
}