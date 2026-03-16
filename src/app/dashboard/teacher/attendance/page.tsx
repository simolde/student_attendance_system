import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect } from "next/navigation";
import Link from "next/link";
import AttendanceForm from "./form";

export default async function TeacherAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ sectionId?: string; date?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (
    !hasRole(session.user.role, [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.TEACHER,
      ROLES.STAFF,
    ])
  ) {
    redirect("/unauthorized");
  }

  const params = await searchParams;
  const selectedSectionId = params.sectionId ?? "";
  const selectedDate = params.date ?? new Date().toISOString().slice(0, 10);

  const sections = await prisma.section.findMany({
    orderBy: { name: "asc" },
  });

  const students = selectedSectionId
    ? await prisma.student.findMany({
        where: { sectionId: selectedSectionId },
        include: { user: true },
        orderBy: { studentNo: "asc" },
      })
    : [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Attendance Recording</h1>
      <p className="mt-2 text-sm text-gray-600">
        Available to SUPER_ADMIN, ADMIN, TEACHER, and STAFF.
      </p>

      <div className="mt-4">
        <Link
          href="/dashboard/teacher/attendance/history"
          className="inline-block rounded border px-4 py-2"
        >
          View Attendance History
        </Link>
      </div>

      <div className="mt-6">
        <AttendanceForm
          sections={sections}
          selectedSectionId={selectedSectionId}
          selectedDate={selectedDate}
          students={students}
        />
      </div>
    </div>
  );
}