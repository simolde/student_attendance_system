import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import DashboardTopbar from "@/components/layout/dashboard-topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GraduationCap,
  Search,
  Users,
  Radio,
  Filter,
  School,
} from "lucide-react";

const PAGE_SIZE = 15;

function buildStudentsQuery(params: {
  q?: string;
  sectionId?: string;
  rfidStatus?: string;
  page?: string | number;
}) {
  const search = new URLSearchParams();

  if (params.q) search.set("q", params.q);
  if (params.sectionId) search.set("sectionId", params.sectionId);
  if (params.rfidStatus) search.set("rfidStatus", params.rfidStatus);
  if (params.page) search.set("page", String(params.page));

  return `/dashboard/admin/students?${search.toString()}`;
}

function formatGradeLevel(value: string | null | undefined) {
  if (!value) return "-";
  return value.replaceAll("_", " ");
}

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    sectionId?: string;
    rfidStatus?: string;
    page?: string;
  }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasRole(session.user.role, [ROLES.SUPER_ADMIN, ROLES.ADMIN])) {
    redirect("/unauthorized");
  }

  const params = await searchParams;

  const q = params.q?.trim() ?? "";
  const sectionId = params.sectionId?.trim() ?? "";
  const rfidStatus = params.rfidStatus?.trim() ?? "";
  const page = Math.max(Number(params.page || "1"), 1);

  const rfidCondition =
    rfidStatus === "WITH_RFID"
      ? { NOT: { rfidUid: null as string | null } }
      : rfidStatus === "WITHOUT_RFID"
        ? { rfidUid: null as string | null }
        : {};

  const where = {
    AND: [
      sectionId ? { sectionId } : {},
      rfidCondition,
      q
        ? {
            OR: [
              { studentNo: { contains: q, mode: "insensitive" as const } },
              { rfidUid: { contains: q, mode: "insensitive" as const } },
              { user: { name: { contains: q, mode: "insensitive" as const } } },
              { user: { email: { contains: q, mode: "insensitive" as const } } },
              { section: { name: { contains: q, mode: "insensitive" as const } } },
            ],
          }
        : {},
    ],
  };

  const [sections, totalCount, students, summaryRows] = await Promise.all([
    prisma.section.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        gradeLevel: true,
      },
    }),
    prisma.student.count({ where }),
    prisma.student.findMany({
      where,
      include: {
        user: true,
        section: true,
      },
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.student.findMany({
      where,
      select: {
        id: true,
        rfidUid: true,
      },
    }),
  ]);

  const totalPages = Math.max(Math.ceil(totalCount / PAGE_SIZE), 1);
  const withRfidCount = summaryRows.filter((item) => !!item.rfidUid).length;
  const withoutRfidCount = summaryRows.filter((item) => !item.rfidUid).length;

  return (
    <div className="portal-shell space-y-6">
      <DashboardTopbar
        title="Students"
        subtitle="Manage student records, sections, and RFID assignment."
        userName={session.user.name ?? session.user.email}
      />

      <section className="portal-card overflow-hidden border-0 p-0">
        <div className="portal-hero relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_28%)]" />
          <div className="relative grid gap-6 px-6 py-8 md:px-8 md:py-10 xl:grid-cols-[1.45fr_0.95fr]">
            <div className="space-y-4 text-white">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                Student Management
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Organize student profiles and RFID data
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-blue-50/90 md:text-base">
                  Search students, filter by section, and review RFID status in
                  a cleaner desktop portal view.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <Users className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Total Students
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{totalCount}</div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <Radio className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    With RFID
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{withRfidCount}</div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <GraduationCap className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Without RFID
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{withoutRfidCount}</div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <School className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Sections
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{sections.length}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Card className="portal-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold text-slate-900">
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="relative xl:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search student no, name, email, RFID"
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
              name="rfidStatus"
              defaultValue={rfidStatus}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-blue-300"
            >
              <option value="">All RFID Status</option>
              <option value="WITH_RFID">With RFID</option>
              <option value="WITHOUT_RFID">Without RFID</option>
            </select>

            <div className="flex gap-2 md:col-span-2 xl:col-span-4">
              <button
                type="submit"
                className="inline-flex h-11 items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                <Filter className="mr-2 h-4 w-4" />
                Apply Filters
              </button>

              <a
                href="/dashboard/admin/students"
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
            Student Records
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Student No</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Student</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Section</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Grade Level</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">RFID UID</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">RFID Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-10 text-center text-sm text-muted-foreground"
                      >
                        No students found.
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => (
                      <tr key={student.id} className="border-t border-slate-100">
                        <td className="px-4 py-4 font-medium text-slate-900">
                          {student.studentNo}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {student.user.name ?? "-"}
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          {student.user.email}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {student.section?.name ?? "-"}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {formatGradeLevel(student.section?.gradeLevel)}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {student.rfidUid ?? "-"}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                              student.rfidUid
                                ? "border-green-200 bg-green-50 text-green-700"
                                : "border-slate-200 bg-slate-50 text-slate-700"
                            }`}
                          >
                            {student.rfidUid ? "WITH_RFID" : "WITHOUT_RFID"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="text-slate-600">
              Page {page} of {totalPages} • Total {totalCount}
            </div>

            <div className="flex items-center gap-2">
              <a
                href={buildStudentsQuery({
                  q,
                  sectionId,
                  rfidStatus,
                  page: Math.max(page - 1, 1),
                })}
                className={`inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 font-medium text-slate-700 ${
                  page <= 1 ? "pointer-events-none opacity-50" : ""
                }`}
              >
                Previous
              </a>

              <a
                href={buildStudentsQuery({
                  q,
                  sectionId,
                  rfidStatus,
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