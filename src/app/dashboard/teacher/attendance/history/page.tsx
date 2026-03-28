import { auth } from "@/auth";
import PageHeader from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { getManilaDateInputValue, dateInputToUtcDate } from "@/lib/date";
import { redirect } from "next/navigation";
import AttendanceHistoryTable from "./history-table";

const PAGE_SIZE = 15;

function buildHistoryQuery(params: {
  q?: string;
  sectionId?: string;
  status?: string;
  source?: string;
  date?: string;
  page?: string | number;
}) {
  const search = new URLSearchParams();

  if (params.q) search.set("q", params.q);
  if (params.sectionId) search.set("sectionId", params.sectionId);
  if (params.status) search.set("status", params.status);
  if (params.source) search.set("source", params.source);
  if (params.date) search.set("date", params.date);
  if (params.page) search.set("page", String(params.page));

  return `/dashboard/teacher/attendance/history?${search.toString()}`;
}

type AttendanceStatusFilter = "PRESENT" | "LATE" | "ABSENT" | "EXCUSED";
type AttendanceSourceFilter = "MANUAL" | "RFID" | "IMPORT";

export default async function AttendanceHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    sectionId?: string;
    status?: string;
    source?: string;
    date?: string;
    page?: string;
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

  const q = params.q?.trim() ?? "";
  const sectionId = params.sectionId?.trim() ?? "";
  const status = params.status?.trim() ?? "";
  const source = params.source?.trim() ?? "";
  const dateInput = params.date?.trim() ?? getManilaDateInputValue();
  const page = Math.max(Number(params.page || "1"), 1);

  const selectedDate = dateInputToUtcDate(dateInput);

  const where = {
    AND: [
      { date: selectedDate },
      sectionId ? { student: { sectionId } } : {},
      status ? { status: status as AttendanceStatusFilter } : {},
      source ? { source: source as AttendanceSourceFilter } : {},
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
              {
                student: {
                  section: {
                    name: { contains: q, mode: "insensitive" as const },
                  },
                },
              },
            ],
          }
        : {},
    ],
  };

  const [sections, totalCount, rows] = await Promise.all([
    prisma.section.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.attendance.count({ where }),
    prisma.attendance.findMany({
      where,
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

  const records = rows.map((row) => ({
    id: row.id,
    date: dateInput,
    status: row.status,
    source: row.source,
    remarks: row.remarks,
    student: {
      studentNo: row.student.studentNo,
      user: {
        name: row.student.user.name,
        email: row.student.user.email,
      },
      section: row.student.section
        ? {
            name: row.student.section.name,
          }
        : null,
    },
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Attendance History"
        description="Review, update, and delete attendance records."
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
          <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search student no, name, email, section"
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

            <select
              name="source"
              defaultValue={source}
              className="h-10 rounded-md border px-3 text-sm"
            >
              <option value="">All sources</option>
              <option value="MANUAL">Manual</option>
              <option value="RFID">RFID</option>
              <option value="IMPORT">Import</option>
            </select>

            <input
              type="date"
              name="date"
              defaultValue={dateInput}
              className="h-10 rounded-md border px-3 text-sm"
            />

            <div className="flex gap-2 md:col-span-2 xl:col-span-5">
              <button
                type="submit"
                className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                Apply Filters
              </button>

              <a
                href="/dashboard/teacher/attendance/history"
                className="inline-flex h-10 items-center rounded-md border px-4 text-sm font-medium"
              >
                Reset
              </a>
            </div>
          </form>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border p-4">
              <div className="text-sm text-muted-foreground">Selected Date</div>
              <div className="mt-1 text-lg font-semibold">{dateInput}</div>
            </div>

            <div className="rounded-xl border p-4">
              <div className="text-sm text-muted-foreground">Records Found</div>
              <div className="mt-1 text-lg font-semibold">{totalCount}</div>
            </div>

            <div className="rounded-xl border p-4">
              <div className="text-sm text-muted-foreground">Current Page</div>
              <div className="mt-1 text-lg font-semibold">
                {page} / {totalPages}
              </div>
            </div>
          </div>

          <AttendanceHistoryTable records={records} />

          <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              Page {page} of {totalPages} • Total {totalCount}
            </div>

            <div className="flex items-center gap-2">
              <a
                href={buildHistoryQuery({
                  q,
                  sectionId,
                  status,
                  source,
                  date: dateInput,
                  page: Math.max(page - 1, 1),
                })}
                className={`inline-flex h-9 items-center rounded-md border px-3 ${
                  page <= 1 ? "pointer-events-none opacity-50" : ""
                }`}
              >
                Previous
              </a>

              <a
                href={buildHistoryQuery({
                  q,
                  sectionId,
                  status,
                  source,
                  date: dateInput,
                  page: Math.min(page + 1, totalPages),
                })}
                className={`inline-flex h-9 items-center rounded-md border px-3 ${
                  page >= totalPages ? "pointer-events-none opacity-50" : ""
                }`}
              >
                Next
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}