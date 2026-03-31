import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import DashboardTopbar from "@/components/layout/dashboard-topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GradeLevel, Prisma } from "@/../generated/prisma/client";
import {
  School,
  Search,
  Filter,
  GraduationCap,
  Layers3,
  Users,
} from "lucide-react";

const PAGE_SIZE = 12;

/* ---------------- HELPERS ---------------- */

function buildSectionsQuery(params: {
  q?: string;
  gradeLevel?: string;
  page?: string | number;
}) {
  const search = new URLSearchParams();

  if (params.q) search.set("q", params.q);
  if (params.gradeLevel) search.set("gradeLevel", params.gradeLevel);
  if (params.page) search.set("page", String(params.page));

  const query = search.toString();
  return query
    ? `/dashboard/admin/sections?${query}`
    : `/dashboard/admin/sections`;
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

/* ---------------- ENUM SOURCE ---------------- */

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

/* ✅ Type guard (no unsafe casting) */
function isGradeLevel(value: string): value is GradeLevel {
  return gradeOptions.includes(value as GradeLevel);
}

/* ---------------- PAGE ---------------- */

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

  if (!session?.user) redirect("/login");

  if (!hasRole(session.user.role, [ROLES.SUPER_ADMIN, ROLES.ADMIN])) {
    redirect("/unauthorized");
  }

  const params = await searchParams;

  const q = params.q?.trim() ?? "";
  const rawGradeLevel = params.gradeLevel?.trim() ?? "";
  const page = Math.max(Number(params.page || "1"), 1);

  /* ✅ Safe parsing */
  const validGradeLevel = isGradeLevel(rawGradeLevel)
    ? rawGradeLevel
    : undefined;

  /* ✅ Clean Prisma where */
  const where: Prisma.SectionWhereInput = {
    AND: [
      ...(validGradeLevel
        ? [{ gradeLevel: validGradeLevel }]
        : []),
      ...(q
        ? [
            {
              name: {
                contains: q,
                mode: Prisma.QueryMode.insensitive, // ✅ FIXED
              },
            },
          ]
        : []),
    ],
  };

  /* ✅ Optimized queries */
  const [totalCount, sections, gradeSummary] = await Promise.all([
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

    /* 🔥 optimized instead of fetching all rows */
    prisma.section.groupBy({
      by: ["gradeLevel"],
    }),
  ]);

  const totalPages = Math.max(Math.ceil(totalCount / PAGE_SIZE), 1);
  const uniqueGradeLevels = gradeSummary.length;

  return (
    <div className="portal-shell space-y-6">
      <DashboardTopbar
        title="Sections"
        subtitle="Manage section records, grade levels, and class groupings."
        userName={session.user.name ?? session.user.email}
      />

      {/* HERO */}
      <section className="portal-card overflow-hidden border-0 p-0">
        <div className="portal-hero relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_28%)]" />

          <div className="relative grid gap-6 px-6 py-8 md:px-8 md:py-10 xl:grid-cols-[1.45fr_0.95fr]">
            <div className="space-y-4 text-white">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                Class Section Management
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-bold md:text-4xl">
                  Organize sections by grade and class grouping
                </h1>
                <p className="max-w-2xl text-sm text-blue-50/90 md:text-base">
                  Review section records, track linked students and enrollments,
                  and keep your attendance structure organized.
                </p>
              </div>
            </div>

            {/* STATS */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Stat icon={School} label="Total Sections" value={totalCount} />
              <Stat icon={Layers3} label="Grade Levels" value={uniqueGradeLevels} />
              <Stat
                icon={GraduationCap}
                label="Current Results"
                value={totalCount}
                full
              />
            </div>
          </div>
        </div>
      </section>

      {/* FILTERS */}
      <Card className="portal-card">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-[1fr_240px_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Search section name"
                className="h-11 w-full rounded-xl border pl-10 pr-3"
              />
            </div>

            <select
              name="gradeLevel"
              defaultValue={validGradeLevel ?? ""}
              className="h-11 rounded-xl border px-3"
            >
              <option value="">All grade levels</option>
              {gradeOptions.map((option) => (
                <option key={option} value={option}>
                  {formatGradeLevel(option)}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <button className="h-11 rounded-xl bg-primary px-4 text-white">
                <Filter className="mr-2 h-4 w-4" />
                Apply
              </button>

              <a
                href="/dashboard/admin/sections"
                className="h-11 rounded-xl border px-4 flex items-center"
              >
                Reset
              </a>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* TABLE */}
      <Card className="portal-card">
        <CardHeader>
          <CardTitle>Section Records</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="overflow-hidden rounded-3xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-3 text-left">Section</th>
                  <th className="px-4 py-3 text-left">Grade</th>
                  <th className="px-4 py-3 text-left">Students</th>
                  <th className="px-4 py-3 text-left">Enrollments</th>
                  <th className="px-4 py-3 text-left">Rules</th>
                  <th className="px-4 py-3 text-left">Created</th>
                  <th className="px-4 py-3 text-left">Updated</th>
                </tr>
              </thead>

              <tbody>
                {sections.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10">
                      No sections found.
                    </td>
                  </tr>
                ) : (
                  sections.map((s) => (
                    <tr key={s.id} className="border-t">
                      <td className="px-4 py-4 font-medium">{s.name}</td>
                      <td className="px-4 py-4">
                        {formatGradeLevel(s.gradeLevel)}
                      </td>
                      <td className="px-4 py-4 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {s._count.students}
                      </td>
                      <td className="px-4 py-4">
                        {s._count.enrollments}
                      </td>
                      <td className="px-4 py-4">{s._count.rules}</td>
                      <td className="px-4 py-4">
                        {formatDateTime(s.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        {formatDateTime(s.updatedAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="flex justify-between text-sm">
            <div>
              Page {page} of {totalPages} • Total {totalCount}
            </div>

            <div className="flex gap-2">
              <a
                href={buildSectionsQuery({
                  q,
                  gradeLevel: validGradeLevel,
                  page: page - 1,
                })}
                className={page <= 1 ? "opacity-50 pointer-events-none" : ""}
              >
                Previous
              </a>

              <a
                href={buildSectionsQuery({
                  q,
                  gradeLevel: validGradeLevel,
                  page: page + 1,
                })}
                className={page >= totalPages ? "opacity-50 pointer-events-none" : ""}
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

/* ---------------- SMALL COMPONENT ---------------- */

function Stat({
  icon: Icon,
  label,
  value,
  full,
}: {
  icon: any;
  label: string;
  value: number;
  full?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border bg-white/10 p-4 text-white ${
        full ? "sm:col-span-2" : ""
      }`}
    >
      <div className="flex items-center gap-2 text-blue-100">
        <Icon className="h-4 w-4" />
        <span className="text-xs uppercase">{label}</span>
      </div>
      <div className="mt-2 text-lg font-semibold">{value}</div>
    </div>
  );
}