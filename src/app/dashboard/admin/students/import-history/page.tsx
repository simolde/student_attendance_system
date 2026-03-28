import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import DashboardTopbar from "@/components/layout/dashboard-topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  History,
  Search,
  Filter,
  Archive,
  CheckCircle2,
  RefreshCcw,
  SkipForward,
  School,
} from "lucide-react";

const PAGE_SIZE = 12;

function buildImportHistoryQuery(params: {
  q?: string;
  schoolYearId?: string;
  createdByUserId?: string;
  archived?: string;
  page?: string | number;
}) {
  const search = new URLSearchParams();

  if (params.q) search.set("q", params.q);
  if (params.schoolYearId) search.set("schoolYearId", params.schoolYearId);
  if (params.createdByUserId) search.set("createdByUserId", params.createdByUserId);
  if (params.archived) search.set("archived", params.archived);
  if (params.page) search.set("page", String(params.page));

  return `/dashboard/admin/students/import-history?${search.toString()}`;
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

export default async function StudentImportHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    schoolYearId?: string;
    createdByUserId?: string;
    archived?: string;
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
  const schoolYearId = params.schoolYearId?.trim() ?? "";
  const createdByUserId = params.createdByUserId?.trim() ?? "";
  const archived = params.archived?.trim() ?? "";
  const page = Math.max(Number(params.page || "1"), 1);

  const archivedFilter =
    archived === "archived"
      ? true
      : archived === "active"
        ? false
        : undefined;

  const where = {
    AND: [
      schoolYearId ? { schoolYearId } : {},
      createdByUserId ? { createdByUserId } : {},
      typeof archivedFilter === "boolean" ? { isArchived: archivedFilter } : {},
      q
        ? {
            OR: [
              { id: { contains: q, mode: "insensitive" as const } },
              {
                schoolYear: {
                  name: { contains: q, mode: "insensitive" as const },
                },
              },
              {
                createdByUser: {
                  name: { contains: q, mode: "insensitive" as const },
                },
              },
              {
                createdByUser: {
                  email: { contains: q, mode: "insensitive" as const },
                },
              },
            ],
          }
        : {},
    ],
  };

  const [schoolYears, admins, totalCount, batches, summaryRows] = await Promise.all([
    prisma.schoolYear.findMany({
      orderBy: { name: "desc" },
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.user.findMany({
      where: {
        role: {
          in: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
        },
      },
      orderBy: [{ name: "asc" }, { email: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
      },
    }),
    prisma.studentImportBatch.count({ where }),
    prisma.studentImportBatch.findMany({
      where,
      include: {
        schoolYear: {
          select: {
            name: true,
          },
        },
        createdByUser: {
          select: {
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.studentImportBatch.findMany({
      where,
      select: {
        id: true,
        isArchived: true,
        createdStudents: true,
        updatedStudents: true,
        skipped: true,
      },
    }),
  ]);

  const totalPages = Math.max(Math.ceil(totalCount / PAGE_SIZE), 1);
  const activeCount = summaryRows.filter((row) => !row.isArchived).length;
  const archivedCount = summaryRows.filter((row) => row.isArchived).length;
  const createdStudentsCount = summaryRows.reduce((sum, row) => sum + row.createdStudents, 0);
  const updatedStudentsCount = summaryRows.reduce((sum, row) => sum + row.updatedStudents, 0);
  const skippedCount = summaryRows.reduce((sum, row) => sum + row.skipped, 0);

  return (
    <div className="portal-shell space-y-6">
      <DashboardTopbar
        title="Student Import History"
        subtitle="Review student import batches, results, and archive status."
        userName={session.user.name ?? session.user.email}
      />

      <section className="portal-card overflow-hidden border-0 p-0">
        <div className="portal-hero relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_28%)]" />
          <div className="relative grid gap-6 px-6 py-8 md:px-8 md:py-10 xl:grid-cols-[1.45fr_0.95fr]">
            <div className="space-y-4 text-white">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                Student Import Tracking
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Review student import results and batch history
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-blue-50/90 md:text-base">
                  Monitor created and updated records, skipped rows, archive status,
                  and who performed each student import batch.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <History className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Total Batches
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{totalCount}</div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <Archive className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Archived
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{archivedCount}</div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Created Students
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{createdStudentsCount}</div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <RefreshCcw className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Updated Students
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{updatedStudentsCount}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card className="portal-card">
          <CardContent className="p-5">
            <div className="text-sm text-slate-500">Active Batches</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">{activeCount}</div>
          </CardContent>
        </Card>

        <Card className="portal-card">
          <CardContent className="p-5">
            <div className="text-sm text-slate-500">Archived Batches</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">{archivedCount}</div>
          </CardContent>
        </Card>

        <Card className="portal-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <SkipForward className="h-4 w-4 text-amber-600" />
              Skipped Rows
            </div>
            <div className="mt-2 text-3xl font-bold text-slate-900">{skippedCount}</div>
          </CardContent>
        </Card>

        <Card className="portal-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <School className="h-4 w-4 text-sky-600" />
              School Years
            </div>
            <div className="mt-2 text-3xl font-bold text-slate-900">{schoolYears.length}</div>
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
          <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="relative xl:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search batch ID, school year, or admin"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm shadow-sm outline-none transition focus:border-blue-300"
              />
            </div>

            <select
              name="schoolYearId"
              defaultValue={schoolYearId}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-blue-300"
            >
              <option value="">All school years</option>
              {schoolYears.map((schoolYear) => (
                <option key={schoolYear.id} value={schoolYear.id}>
                  {schoolYear.name}
                </option>
              ))}
            </select>

            <select
              name="createdByUserId"
              defaultValue={createdByUserId}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-blue-300"
            >
              <option value="">All admins</option>
              {admins.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.name ?? admin.email}
                </option>
              ))}
            </select>

            <select
              name="archived"
              defaultValue={archived}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-blue-300"
            >
              <option value="">All status</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
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
                href="/dashboard/admin/students/import-history"
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
            Import Batch Records
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Batch ID</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">School Year</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Created By</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Rows</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Created</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Updated</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Skipped</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Students</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-4 py-10 text-center text-sm text-muted-foreground"
                      >
                        No import batches found.
                      </td>
                    </tr>
                  ) : (
                    batches.map((batch) => (
                      <tr key={batch.id} className="border-t border-slate-100">
                        <td className="px-4 py-4 font-medium text-slate-900">
                          {batch.id}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {batch.schoolYear?.name ?? "-"}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {batch.createdByUser?.name ?? batch.createdByUser?.email ?? "-"}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {batch.totalRows}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {batch.createdStudents}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {batch.updatedStudents}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {batch.skipped}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {batch._count.students}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                              batch.isArchived
                                ? "border-slate-200 bg-slate-50 text-slate-700"
                                : "border-green-200 bg-green-50 text-green-700"
                            }`}
                          >
                            {batch.isArchived ? "ARCHIVED" : "ACTIVE"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {formatDateTime(batch.createdAt)}
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
                href={buildImportHistoryQuery({
                  q,
                  schoolYearId,
                  createdByUserId,
                  archived,
                  page: Math.max(page - 1, 1),
                })}
                className={`inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 font-medium text-slate-700 ${
                  page <= 1 ? "pointer-events-none opacity-50" : ""
                }`}
              >
                Previous
              </a>

              <a
                href={buildImportHistoryQuery({
                  q,
                  schoolYearId,
                  createdByUserId,
                  archived,
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