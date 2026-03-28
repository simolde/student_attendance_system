import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import DashboardTopbar from "@/components/layout/dashboard-topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dateInputToUtcDate, getManilaDateInputValue } from "@/lib/date";
import {
  FileBarChart2,
  CalendarDays,
  Filter,
  School,
  CheckCircle2,
  Clock3,
  XCircle,
  FileCheck,
} from "lucide-react";

function formatGradeLevel(value: string | null | undefined) {
  if (!value) return "-";
  return value.replaceAll("_", " ");
}

function countStatus(
  rows: { status: "PRESENT" | "LATE" | "ABSENT" | "EXCUSED" }[],
  status: "PRESENT" | "LATE" | "ABSENT" | "EXCUSED"
) {
  return rows.filter((item) => item.status === status).length;
}

export default async function AttendanceReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    date?: string;
    sectionId?: string;
  }>;
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
  const dateInput = params.date?.trim() ?? getManilaDateInputValue();
  const sectionId = params.sectionId?.trim() ?? "";
  const selectedDate = dateInputToUtcDate(dateInput);

  const [sections, attendanceRows] = await Promise.all([
    prisma.section.findMany({
      orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        gradeLevel: true,
      },
    }),
    prisma.attendance.findMany({
      where: {
        AND: [
          { date: selectedDate },
          sectionId ? { student: { sectionId } } : {},
        ],
      },
      include: {
        student: {
          include: {
            user: true,
            section: true,
          },
        },
      },
      orderBy: [
        { student: { section: { gradeLevel: "asc" } } },
        { student: { section: { name: "asc" } } },
        { student: { studentNo: "asc" } },
      ],
    }),
  ]);

  const selectedSection =
    sections.find((section) => section.id === sectionId) ?? null;

  const presentCount = countStatus(attendanceRows, "PRESENT");
  const lateCount = countStatus(attendanceRows, "LATE");
  const absentCount = countStatus(attendanceRows, "ABSENT");
  const excusedCount = countStatus(attendanceRows, "EXCUSED");

  return (
    <div className="portal-shell space-y-6">
      <DashboardTopbar
        title="Attendance Reports"
        subtitle="Review attendance summaries by date and section."
        userName={session.user.name ?? session.user.email}
      />

      <section className="portal-card overflow-hidden border-0 p-0">
        <div className="portal-hero relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_28%)]" />
          <div className="relative grid gap-6 px-6 py-8 md:px-8 md:py-10 xl:grid-cols-[1.45fr_0.95fr]">
            <div className="space-y-4 text-white">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                Attendance Reporting
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  View attendance summaries by date and section
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-blue-50/90 md:text-base">
                  Review daily attendance results and prepare your records for
                  validation, printing, or future export.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <CalendarDays className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Report Date
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{dateInput}</div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <School className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Section
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">
                  {selectedSection?.name ?? "All Sections"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Card className="portal-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold text-slate-900">
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <input
              type="date"
              name="date"
              defaultValue={dateInput}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-blue-300"
            />

            <select
              name="sectionId"
              defaultValue={sectionId}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-blue-300"
            >
              <option value="">All sections</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name} — {formatGradeLevel(section.gradeLevel)}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <button
                type="submit"
                className="inline-flex h-11 items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                <Filter className="mr-2 h-4 w-4" />
                Apply
              </button>

              <a
                href="/dashboard/reports/attendance"
                className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700"
              >
                Reset
              </a>
            </div>
          </form>
        </CardContent>
      </Card>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card className="portal-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Present
            </div>
            <div className="mt-2 text-3xl font-bold text-slate-900">
              {presentCount}
            </div>
          </CardContent>
        </Card>

        <Card className="portal-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock3 className="h-4 w-4 text-amber-600" />
              Late
            </div>
            <div className="mt-2 text-3xl font-bold text-slate-900">
              {lateCount}
            </div>
          </CardContent>
        </Card>

        <Card className="portal-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <XCircle className="h-4 w-4 text-rose-600" />
              Absent
            </div>
            <div className="mt-2 text-3xl font-bold text-slate-900">
              {absentCount}
            </div>
          </CardContent>
        </Card>

        <Card className="portal-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <FileCheck className="h-4 w-4 text-sky-600" />
              Excused
            </div>
            <div className="mt-2 text-3xl font-bold text-slate-900">
              {excusedCount}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="portal-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
            <FileBarChart2 className="h-5 w-5 text-slate-700" />
            Attendance Report Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="px-4 py-3 text-left font-medium text-slate-700">
                      Student No
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">
                      Student
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">
                      Section
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">
                      Source
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">
                      Remarks
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-sm text-muted-foreground"
                      >
                        No attendance records found for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    attendanceRows.map((row) => (
                      <tr key={row.id} className="border-t border-slate-100">
                        <td className="px-4 py-4 font-medium text-slate-900">
                          {row.student.studentNo}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {row.student.user.name ?? row.student.user.email}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {row.student.section?.name ?? "-"}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                              row.status === "PRESENT"
                                ? "border-green-200 bg-green-50 text-green-700"
                                : row.status === "LATE"
                                  ? "border-amber-200 bg-amber-50 text-amber-700"
                                  : row.status === "ABSENT"
                                    ? "border-rose-200 bg-rose-50 text-rose-700"
                                    : "border-sky-200 bg-sky-50 text-sky-700"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {row.source}
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          {row.remarks ?? "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}