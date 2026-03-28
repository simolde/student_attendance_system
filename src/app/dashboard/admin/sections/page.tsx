import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import DashboardTopbar from "@/components/layout/dashboard-topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  School,
  Search,
  Filter,
  GraduationCap,
  Layers3,
  Users,
} from "lucide-react";

const PAGE_SIZE = 12;

function buildSectionsQuery(params: {
  q?: string;
  gradeLevel?: string;
  page?: string | number;
}) {
  const search = new URLSearchParams();

  if (params.q) search.set("q", params.q);
  if (params.gradeLevel) search.set("gradeLevel", params.gradeLevel);
  if (params.page) search.set("page", String(params.page));

  return `/dashboard/admin/sections?${search.toString()}`;
}

function formatGradeLevel(value: string | null | undefined) {
  if (!value) return "-";
  return value.replaceAll("_", " ");
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

const gradeOptions = [
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

export default async function SectionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    gradeLevel?: string;
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
  const page = Math.max(Number(params.page || "1"), 1);

  const where = {
    AND: [
      gradeLevel ? { gradeLevel: gradeLevel as (typeof gradeOptions)[number] } : {},
      q
        ? {
            name: {
              contains: q,
              mode: "insensitive" as const,
            },
          }
        : {},
    ],
  };

  const [totalCount, sections, summaryRows] = await Promise.all([
    prisma.section.count({ where }),
    prisma.section.findMany({
      where,
      include: {
        _count: {
          select: {
            students: true,
            enrollments: true,
            rules: true,
          },
        },
      },
      orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.section.findMany({
      select: {
        gradeLevel: true,
      },
    }),
  ]);

  const totalPages = Math.max(Math.ceil(totalCount / PAGE_SIZE), 1);
  const uniqueGradeLevels = new Set(summaryRows.map((item) => item.gradeLevel)).size;

  return (
    <div className="portal-shell space-y-6">
      <DashboardTopbar
        title="Sections"
        subtitle="Manage section records, grade levels, and class groupings."
        userName={session.user.name ?? session.user.email}
      />

      <section className="portal-card overflow-hidden border-0 p-0">
        <div className="portal-hero relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_28%)]" />
          <div className="relative grid gap-6 px-6 py-8 md:px-8 md:py-10 xl:grid-cols-[1.45fr_0.95fr]">
            <div className="space-y-4 text-white">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                Class Section Management
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Organize sections by grade and class grouping
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-blue-50/90 md:text-base">
                  Review section records, track linked students and enrollments,
                  and keep your attendance structure organized.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <School className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Total Sections
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{summaryRows.length}</div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <Layers3 className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Grade Levels
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{uniqueGradeLevels}</div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur sm:col-span-2">
                <div className="flex items-center gap-2 text-blue-100">
                  <GraduationCap className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Current Results
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{totalCount}</div>
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
          <form className="grid gap-4 md:grid-cols-[1fr_240px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search section name"
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

            <div className="flex gap-2">
              <button
                type="submit"
                className="inline-flex h-11 items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                <Filter className="mr-2 h-4 w-4" />
                Apply
              </button>

              <a
                href="/dashboard/admin/sections"
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
            Section Records
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Section Name</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Grade Level</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Students</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Enrollments</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Rules</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Created</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {sections.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-10 text-center text-sm text-muted-foreground"
                      >
                        No sections found.
                      </td>
                    </tr>
                  ) : (
                    sections.map((section) => (
                      <tr key={section.id} className="border-t border-slate-100">
                        <td className="px-4 py-4 font-medium text-slate-900">
                          {section.name}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {formatGradeLevel(section.gradeLevel)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2 text-slate-700">
                            <Users className="h-4 w-4 text-slate-400" />
                            <span>{section._count.students}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {section._count.enrollments}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {section._count.rules}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {formatDateTime(section.createdAt)}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {formatDateTime(section.updatedAt)}
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
                href={buildSectionsQuery({
                  q,
                  gradeLevel,
                  page: Math.max(page - 1, 1),
                })}
                className={`inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 font-medium text-slate-700 ${
                  page <= 1 ? "pointer-events-none opacity-50" : ""
                }`}
              >
                Previous
              </a>

              <a
                href={buildSectionsQuery({
                  q,
                  gradeLevel,
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