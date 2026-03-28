import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { dateInputToUtcDate, getManilaDateInputValue } from "@/lib/date";
import AttendanceHistoryTable from "./history-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CalendarDays,
  ClipboardList,
  Filter,
  Search,
} from "lucide-react";

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

function countStatus(records: { status: AttendanceStatusFilter }[], status: AttendanceStatusFilter) {
  return records.filter((item) => item.status === status).length;
}

function formatTimeForDisplay(date: Date | null) {
  if (!date) return null;

  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

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

  const [sections, totalCount, rows, allRowsForSummary] = await Promise.all([
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
      orderBy: [{ student: { studentNo: "asc" } }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.attendance.findMany({
      where,
      select: {
        status: true,
      },
    }),
  ]);

  const totalPages = Math.max(Math.ceil(totalCount / PAGE_SIZE), 1);

  const records = rows.map((row) => ({
    id: row.id,
    date: dateInput,
    status: row.status,
    source: row.source,
    remarks: row.remarks,
    timeIn: formatTimeForDisplay(row.timeIn),
    timeOut: formatTimeForDisplay(row.timeOut),
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

  const presentCount = countStatus(allRowsForSummary, "PRESENT");
  const lateCount = countStatus(allRowsForSummary, "LATE");
  const absentCount = countStatus(allRowsForSummary, "ABSENT");
  const excusedCount = countStatus(allRowsForSummary, "EXCUSED");

  return (
    <div className="portal-shell space-y-8">
      <section className="portal-card overflow-hidden border-0 p-0">
        <div className="portal-hero relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_28%)]" />
          <div className="relative grid gap-6 px-6 py-8 md:px-8 md:py-10 xl:grid-cols-[1.45fr_0.95fr]">
            <div className="space-y-4 text-white">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                Attendance History
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Review and manage attendance records
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-blue-50/90 md:text-base">
                  Filter records by date, section, status, and source. Update or
                  remove entries directly from the history table.
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
                <div className="mt-2 text-lg font-semibold">{dateInput}</div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <ClipboardList className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Records Found
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{totalCount}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card className="portal-card">
          <CardContent className="p-5">
            <div className="text-sm text-slate-500">Present</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">
              {presentCount}
            </div>
          </CardContent>
        </Card>

        <Card className="portal-card">
          <CardContent className="p-5">
            <div className="text-sm text-slate-500">Late</div>
            <div className="mt-2 text-3xl font-bold text-amber-600">
              {lateCount}
            </div>
          </CardContent>
        </Card>

        <Card className="portal-card">
          <CardContent className="p-5">
            <div className="text-sm text-slate-500">Absent</div>
            <div className="mt-2 text-3xl font-bold text-rose-600">
              {absentCount}
            </div>
          </CardContent>
        </Card>

        <Card className="portal-card">
          <CardContent className="p-5">
            <div className="text-sm text-slate-500">Excused</div>
            <div className="mt-2 text-3xl font-bold text-sky-600">
              {excusedCount}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="portal-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold text-slate-900">
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="relative xl:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search student no, name, email, section"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm shadow-sm outline-none transition focus:border-blue-300"
              />
            </div>

            <select
              name="sectionId"
              defaultValue={sectionId}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-blue-300"
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
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-blue-300"
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
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-blue-300"
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
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-blue-300"
            />

            <div className="flex gap-2 md:col-span-2 xl:col-span-5">
              <button
                type="submit"
                className="inline-flex h-11 items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                <Filter className="mr-2 h-4 w-4" />
                Apply Filters
              </button>

              <a
                href="/dashboard/teacher/attendance/history"
                className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700"
              >
                Reset
              </a>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="portal-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold text-slate-900">
            Attendance Records
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <AttendanceHistoryTable records={records} />

          <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="text-slate-600">
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
                className={`inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 font-medium text-slate-700 ${
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
                className={`inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 font-medium text-slate-700 ${
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