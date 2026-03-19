import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect } from "next/navigation";
import Link from "next/link";
import AttendanceForm from "./form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import PageHeader from "@/components/layout/page-header";

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
    <div className="p-6 space-y-8">
      <PageHeader
        title="Attendance Recording"
        description="Record attendance by section and date."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Teacher", href: "/dashboard/teacher" },
          { label: "Attendance" },
        ]}
      />

      <div>
        <Link
          href="/dashboard/teacher/attendance/history"
          className="inline-block rounded-md border px-4 py-2 text-sm hover:bg-accent"
        >
          View Attendance History
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Record Attendance</CardTitle>
          <CardDescription>
            Select a section, load students, then save attendance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AttendanceForm
            sections={sections}
            selectedSectionId={selectedSectionId}
            selectedDate={selectedDate}
            students={students}
          />
        </CardContent>
      </Card>
    </div>
  );
}