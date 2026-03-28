import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import AttendanceForm from "./form";
import { getManilaDateInputValue } from "@/lib/date";
import DashboardTopbar from "@/components/layout/dashboard-topbar";
import {
  CalendarDays,
  ClipboardCheck,
  School,
  Users,
} from "lucide-react";

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
  const selectedDate = params.date ?? getManilaDateInputValue();

  const [sections, activeSchoolYear] = await Promise.all([
    prisma.section.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.schoolYear.findFirst({
      where: { isActive: true },
      select: { id: true, name: true },
    }),
  ]);

  const students =
    selectedSectionId && activeSchoolYear
      ? (
          await prisma.enrollment.findMany({
            where: {
              sectionId: selectedSectionId,
              schoolYearId: activeSchoolYear.id,
              status: "ENROLLED",
            },
            include: {
              student: {
                include: {
                  user: true,
                },
              },
            },
            orderBy: {
              student: {
                studentNo: "asc",
              },
            },
          })
        ).map((enrollment) => ({
          id: enrollment.student.id,
          studentNo: enrollment.student.studentNo,
          user: {
            name: enrollment.student.user.name,
            email: enrollment.student.user.email,
          },
        }))
      : [];

  const selectedSectionName =
    sections.find((section) => section.id === selectedSectionId)?.name ?? "-";

  return (
    <div className="portal-shell space-y-6">
      <DashboardTopbar
        title="Attendance Recording"
        subtitle="Load a section, choose a date, and record daily attendance."
        userName={session.user.name ?? session.user.email}
      />

      <section className="portal-card overflow-hidden border-0 p-0">
        <div className="portal-hero relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_28%)]" />
          <div className="relative grid gap-6 px-6 py-8 md:px-8 md:py-10 xl:grid-cols-[1.45fr_0.95fr]">
            <div className="space-y-4 text-white">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                Teacher Attendance Workspace
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Record attendance with a cleaner workflow
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-blue-50/90 md:text-base">
                  Select the class section and date, then mark each student as
                  present, late, absent, or excused in one place.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <CalendarDays className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Selected Date
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{selectedDate}</div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <School className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Active School Year
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">
                  {activeSchoolYear?.name ?? "No Active School Year"}
                </div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <ClipboardCheck className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Selected Section
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">
                  {selectedSectionId ? selectedSectionName : "No Section Selected"}
                </div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <Users className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Students Loaded
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{students.length}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <Card className="portal-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-semibold text-slate-900">
              Record Attendance
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <AttendanceForm
              sections={sections}
              selectedSectionId={selectedSectionId}
              selectedDate={selectedDate}
              students={students}
              activeSchoolYearName={activeSchoolYear?.name ?? null}
            />
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card className="portal-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-semibold text-slate-900">
                Recording Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="portal-card-soft p-4">
                <div className="portal-chip">Step 1</div>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  Select the correct section and date before loading students.
                </p>
              </div>

              <div className="portal-card-soft p-4">
                <div className="portal-chip">Step 2</div>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  Mark each student carefully and add remarks when needed for
                  absences, tardiness, or excused cases.
                </p>
              </div>

              <div className="portal-card-soft p-4">
                <div className="portal-chip">Step 3</div>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  Save once the list is complete, then verify the result in
                  attendance history.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="portal-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-semibold text-slate-900">
                Quick Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 pt-0">
              <div className="portal-card-soft p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Active School Year
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {activeSchoolYear?.name ?? "-"}
                </div>
              </div>

              <div className="portal-card-soft p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Section
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {selectedSectionId ? selectedSectionName : "Not selected"}
                </div>
              </div>

              <div className="portal-card-soft p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Loaded Students
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {students.length}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}