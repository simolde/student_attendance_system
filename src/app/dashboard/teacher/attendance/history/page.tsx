import { auth } from "@/auth";
import PageHeader from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { getManilaDateInputValue, dateInputToUtcDate } from "@/lib/date";
import { redirect } from "next/navigation";

const PAGE_SIZE = 20;

export default async function AttendanceHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    sectionId?: string;
    status?: string;
    date?: string;
    page?: string;
  }>;
}) {
  const session = await auth();

  if (!session?.user) redirect("/login");

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

  const q = params.q?.trim() ?? "";
  const sectionId = params.sectionId?.trim() ?? "";
  const status = params.status?.trim() ?? "";
  const dateInput = params.date?.trim() ?? getManilaDateInputValue();
  const page = Math.max(Number(params.page || "1"), 1);

  const selectedDate = dateInputToUtcDate(dateInput);

  const [sections, totalCount, rows] = await Promise.all([
    prisma.section.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, gradeLevel: true },
    }),
    prisma.attendance.count({
      where: {
        AND: [
          { date: selectedDate },
          sectionId ? { student: { sectionId } } : {},
          status ? { status: status as "PRESENT" | "LATE" | "ABSENT" | "EXCUSED" } : {},
          q
            ? {
                OR: [
                  {
                    student: {
                      studentNo: { contains: q, mode: "insensitive" as const },
                    },
                  },
                  {
                    student: {
                      user: {
                        name: { contains: q, mode: "insensitive" as const },
                      },
                    },
                  },
                  {
                    student: {
                      user: {
                        email: { contains: q, mode: "insensitive" as const },
                      },
                    },
                  },
                ],
              }
            : {},
        ],
      },
    }),
    prisma.attendance.findMany({
      where: {
        AND: [
          { date: selectedDate },
          sectionId ? { student: { sectionId } } : {},
          status ? { status: status as "PRESENT" | "LATE" | "ABSENT" | "EXCUSED" } : {},
          q
            ? {
                OR: [
                  {
                    student: {
                      studentNo: { contains: q, mode: "insensitive" as const },
                    },
                  },
                  {
                    student: {
                      user: {
                        name: { contains: q, mode: "insensitive" as const },
                      },
                    },
                  },
                  {
                    student: {
                      user: {
                        email: { contains: q, mode: "insensitive" as const },
                      },
                    },
                  },
                ],
              }
            : {},
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
        { student: { studentNo: "asc" } },
        { createdAt: "desc" },
      ],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(Math.ceil(totalCount / PAGE_SIZE), 1);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Attendance History"
        description="Review saved attendance records by date, section, and status."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Teacher", href: "/dashboard/teacher" },
          { label: "Attendance", href: "/dashboard/teacher/attendance" },
          { label: "History" },
        ]}
      />

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <form className="grid gap-4 md:grid-cols-4">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search student no, name, email"
              className="h-10 rounded-md border px-3 text-sm"
            />

            <select
              name="sectionId"
              defaultValue={sectionId}
              className="h-10 rounded-md border px-3 text-sm"
            >
              <option value="">All sections</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>

            <select
              name="status"
              defaultValue={status}
              className="h-10 rounded-md border px-3 text-sm"
            >
              <option value="">All status</option>
              <option value="PRESENT">Present</option>
              <option value="LATE">Late</option>
              <option value="ABSENT">Absent</option>
              <option value="EXCUSED">Excused</option>
            </select>

            <input
              type="date"
              name="date"
              defaultValue={dateInput}
              className="h-10 rounded-md border px-3 text-sm"
            />

            <div className="md:col-span-4 flex gap-2">
              <button
                type="submit"
                className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm text-primary-foreground"
              >
                Apply Filters
              </button>
              <a
                href="/dashboard/teacher/attendance/history"
                className="inline-flex h-10 items-center rounded-md border px-4 text-sm"
              >
                Reset
              </a>
            </div>
          </form>

          <div className="overflow-x-auto rounded-md border">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-3 py-2 text-left font-medium">Date</th>
                  <th className="px-3 py-2 text-left font-medium">Student No</th>
                  <th className="px-3 py-2 text-left font-medium">Student</th>
                  <th className="px-3 py-2 text-left font-medium">Section</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                  <th className="px-3 py-2 text-left font-medium">Source</th>
                  <th className="px-3 py-2 text-left font-medium">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                      No attendance records found.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className="border-b">
                      <td className="px-3 py-2">{dateInput}</td>
                      <td className="px-3 py-2">{row.student.studentNo}</td>
                      <td className="px-3 py-2">{row.student.user.name ?? "-"}</td>
                      <td className="px-3 py-2">{row.student.section?.name ?? "-"}</td>
                      <td className="px-3 py-2">{row.status}</td>
                      <td className="px-3 py-2">{row.source}</td>
                      <td className="px-3 py-2">{row.remarks ?? "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div>
              Page {page} of {totalPages} • Total {totalCount}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}