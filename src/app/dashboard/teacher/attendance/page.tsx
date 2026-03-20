import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect } from "next/navigation";
import PageHeader from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import AttendanceForm from "./form";

export default async function AttendancePage({
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
        include: {
          user: true,
        },
        orderBy: {
          studentNo: "asc",
        },
      })
    : [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Attendance Recording"
        description="Load a section and date, then record attendance for each student."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Teacher", href: "/dashboard/teacher" },
          { label: "Attendance" },
        ]}
      />

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Record Attendance</CardTitle>
          <CardDescription>
            Choose a section and date, then save attendance entries.
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