import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import DashboardTopbar from "@/components/layout/dashboard-topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Clock3,
  Search,
  Filter,
  ShieldCheck,
  Layers3,
  CheckCircle2,
} from "lucide-react";
import type { Prisma, GradeLevel } from "@/../generated/prisma/client";

const PAGE_SIZE = 12;

function buildRulesQuery(params: {
  q?: string;
  gradeLevel?: string;
  sectionId?: string;
  status?: string;
  page?: string | number;
}) {
  const search = new URLSearchParams();

  if (params.q) search.set("q", params.q);
  if (params.gradeLevel) search.set("gradeLevel", params.gradeLevel);
  if (params.sectionId) search.set("sectionId", params.sectionId);
  if (params.status) search.set("status", params.status);
  if (params.page) search.set("page", String(params.page));

  return `/dashboard/admin/attendance-rules?${search.toString()}`;
}

function formatGradeLevel(value: string | null | undefined) {
  if (!value) return "-";
  return value.replaceAll("_", " ");
}

function formatTimeValue(value: string | null | undefined) {
  return value && value.trim().length > 0 ? value : "-";
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(value);
}

const gradeOptions: GradeLevel[] = [
  "PRE_NURSERY",
  "NURSERY",
  "KINDER",
  "GRADE_1",
  "GRADE_2",
  "GRADE_3",
  "GRADE_4",
  "GRADE_5",
  "GRADE_6",
  "GRADE_7",
  "GRADE_8",
  "GRADE_9",
  "GRADE_10",
  "GRADE_11",
  "GRADE_12",
];

export default async function AttendanceRulesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    gradeLevel?: string;
    sectionId?: string;
    status?: string;
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
  const gradeLevel = params.gradeLevel?.trim() ?? "";
  const sectionId = params.sectionId?.trim() ?? "";
  const status = params.status?.trim() ?? "";
  const page = Math.max(Number(params.page || "1"), 1);

  const where: Prisma.AttendanceRuleWhereInput = {
    AND: [
      gradeLevel ? { gradeLevel: gradeLevel as GradeLevel } : {},
      sectionId ? { sectionId } : {},
      status === "ACTIVE"
        ? { isActive: true }
        : status === "INACTIVE"
          ? { isActive: false }
          : {},
      q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              {
                section: {
                  name: { contains: q, mode: "insensitive" },
                },
              },
            ],
          }
        : {},
    ],
  };

  const [sections, totalCount, rules, summaryRows] = await Promise.all([
    prisma.section.findMany({
      orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        gradeLevel: true,
      },
    }),
    prisma.attendanceRule.count({ where }),
    prisma.attendanceRule.findMany({
      where,
      include: {
        section: {
          select: {
            name: true,
            gradeLevel: true,
          },
        },
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.attendanceRule.findMany({
      select: {
        id: true,
        isActive: true,
        isDefault: true,
      },
    }),
  ]);

  const totalPages = Math.max(Math.ceil(totalCount / PAGE_SIZE), 1);
  const activeCount = summaryRows.filter((item) => item.isActive).length;
  const defaultCount = summaryRows.filter((item) => item.isDefault).length;
  const customCount = summaryRows.filter((item) => !item.isDefault).length;

  return (
    <div className="portal-shell space-y-6">
      <DashboardTopbar
        title="Attendance Rules"
        subtitle="Review attendance time rules by grade level, section, and default settings."
        userName={session.user.name ?? session.user.email}
      />

      <section className="portal-card overflow-hidden border-0 p-0">
        <div className="portal-hero relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_28%)]" />
          <div className="relative grid gap-6 px-6 py-8 md:px-8 md:py-10 xl:grid-cols-[1.45fr_0.95fr]">
            <div className="space-y-4 text-white">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                Attendance Rule Management
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Review attendance schedules and time windows
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-blue-50/90 md:text-base">
                  Monitor default and section-specific rules for time in, late cutoff,
                  and time out windows used in your attendance system.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <Clock3 className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Total Rules
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{summaryRows.length}</div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Active Rules
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{activeCount}</div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Default Rules
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{defaultCount}</div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <Layers3 className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Custom Rules
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{customCount}</div>
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
                placeholder="Search rule name or section"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm shadow-sm outline-none transition focus:border-blue-300"
              />
            </div>

            <select
              name="gradeLevel"
              defaultValue={gradeLevel}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-blue-300"
            >
              <option value="">All grade levels</option>
              {gradeOptions.map((option) => (
                <option key={option} value={option}>
                  {formatGradeLevel(option)}
                </option>
              ))}
            </select>

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
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
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
                href="/dashboard/admin/attendance-rules"
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
            Attendance Rule Records
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Rule Name</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Grade Level</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Section</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Time In Start</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Time In End</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Late After</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Time Out Start</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Time Out End</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.length === 0 ? (
                    <tr>
                      <td
                        colSpan={11}
                        className="px-4 py-10 text-center text-sm text-muted-foreground"
                      >
                        No attendance rules found.
                      </td>
                    </tr>
                  ) : (
                    rules.map((rule) => (
                      <tr key={rule.id} className="border-t border-slate-100">
                        <td className="px-4 py-4 font-medium text-slate-900">
                          {rule.name}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {formatGradeLevel(rule.gradeLevel)}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {rule.section?.name ?? "-"}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {formatTimeValue(rule.timeInStart)}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {formatTimeValue(rule.timeInEnd)}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {formatTimeValue(rule.lateAfter)}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {formatTimeValue(rule.timeOutStart)}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {formatTimeValue(rule.timeOutEnd)}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                              rule.isDefault
                                ? "border-blue-200 bg-blue-50 text-blue-700"
                                : "border-violet-200 bg-violet-50 text-violet-700"
                            }`}
                          >
                            {rule.isDefault ? "DEFAULT" : "CUSTOM"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                              rule.isActive
                                ? "border-green-200 bg-green-50 text-green-700"
                                : "border-slate-200 bg-slate-50 text-slate-700"
                            }`}
                          >
                            {rule.isActive ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {formatDateTime(rule.updatedAt)}
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
                href={buildRulesQuery({
                  q,
                  gradeLevel,
                  sectionId,
                  status,
                  page: Math.max(page - 1, 1),
                })}
                className={`inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 font-medium text-slate-700 ${
                  page <= 1 ? "pointer-events-none opacity-50" : ""
                }`}
              >
                Previous
              </a>

              <a
                href={buildRulesQuery({
                  q,
                  gradeLevel,
                  sectionId,
                  status,
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