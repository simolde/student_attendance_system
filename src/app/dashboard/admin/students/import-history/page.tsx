import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import TableToolbar from "@/components/layout/table-toolbar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Download } from "lucide-react";
import { toggleImportBatchArchive } from "./actions";
import CopyBatchIdButton from "@/components/copy-batch-id-button";

const PAGE_SIZE = 10;

function formatManilaDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function buildDateRange(dateFrom: string, dateTo: string) {
  const createdAt: { gte?: Date; lte?: Date } = {};

  if (dateFrom) {
    createdAt.gte = new Date(`${dateFrom}T00:00:00.000+08:00`);
  }

  if (dateTo) {
    createdAt.lte = new Date(`${dateTo}T23:59:59.999+08:00`);
  }

  return Object.keys(createdAt).length > 0 ? createdAt : undefined;
}

export default async function StudentImportHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    archived?: string;
    q?: string;
    page?: string;
    dateFrom?: string;
    dateTo?: string;
    schoolYearId?: string;
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
  const showArchived = params.archived === "1";
  const q = params.q?.trim() ?? "";
  const dateFrom = params.dateFrom?.trim() ?? "";
  const dateTo = params.dateTo?.trim() ?? "";
  const schoolYearId = params.schoolYearId?.trim() ?? "";
  const page = Math.max(Number(params.page || "1"), 1);

  const createdAtRange = buildDateRange(dateFrom, dateTo);

  const [schoolYears, batches, totalBatches, allCounts] = await Promise.all([
    prisma.schoolYear.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.studentImportBatch.findMany({
      where: {
        ...(showArchived ? {} : { isArchived: false }),
        ...(schoolYearId ? { schoolYearId } : {}),
        ...(createdAtRange ? { createdAt: createdAtRange } : {}),
        ...(q
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
          : {}),
      },
      include: {
        createdByUser: {
          select: {
            name: true,
            email: true,
          },
        },
        schoolYear: {
          select: {
            name: true,
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
    prisma.studentImportBatch.count({
      where: {
        ...(showArchived ? {} : { isArchived: false }),
        ...(schoolYearId ? { schoolYearId } : {}),
        ...(createdAtRange ? { createdAt: createdAtRange } : {}),
        ...(q
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
          : {}),
      },
    }),
    prisma.studentImportBatch.groupBy({
      by: ["isArchived"],
      _count: {
        _all: true,
      },
    }),
  ]);

  const totalPages = Math.max(Math.ceil(totalBatches / PAGE_SIZE), 1);

  const activeCount =
    allCounts.find((row) => row.isArchived === false)?._count._all ?? 0;
  const archivedCount =
    allCounts.find((row) => row.isArchived === true)?._count._all ?? 0;

  function buildUrl(nextPage: number) {
    const sp = new URLSearchParams();
    if (showArchived) sp.set("archived", "1");
    if (q) sp.set("q", q);
    if (dateFrom) sp.set("dateFrom", dateFrom);
    if (dateTo) sp.set("dateTo", dateTo);
    if (schoolYearId) sp.set("schoolYearId", schoolYearId);
    sp.set("page", String(nextPage));
    return `/dashboard/admin/students/import-history?${sp.toString()}`;
  }

  function buildBaseUrl(archived: boolean) {
    const sp = new URLSearchParams();
    if (archived) sp.set("archived", "1");
    if (q) sp.set("q", q);
    if (dateFrom) sp.set("dateFrom", dateFrom);
    if (dateTo) sp.set("dateTo", dateTo);
    if (schoolYearId) sp.set("schoolYearId", schoolYearId);
    return `/dashboard/admin/students/import-history${
      sp.toString() ? `?${sp.toString()}` : ""
    }`;
  }

  function buildExportUrl() {
    const sp = new URLSearchParams();
    if (showArchived) sp.set("archived", "1");
    if (q) sp.set("q", q);
    if (dateFrom) sp.set("dateFrom", dateFrom);
    if (dateTo) sp.set("dateTo", dateTo);
    if (schoolYearId) sp.set("schoolYearId", schoolYearId);
    return `/api/students/export-import-history${
      sp.toString() ? `?${sp.toString()}` : ""
    }`;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Student Import History"
        description="Review past student import batches and export credentials again when needed."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin", href: "/dashboard/admin" },
          { label: "Student Management", href: "/dashboard/admin/students" },
          { label: "Import History" },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <a href={buildExportUrl()}>
                <Download className="mr-2 h-4 w-4" />
                Export History CSV
              </a>
            </Button>

            <Button asChild variant={showArchived ? "outline" : "default"}>
              <Link href={buildBaseUrl(false)}>
                Active Batches
                <span className="ml-2 rounded-md bg-white/20 px-2 py-0.5 text-xs">
                  {activeCount}
                </span>
              </Link>
            </Button>

            <Button asChild variant={showArchived ? "default" : "outline"}>
              <Link href={buildBaseUrl(true)}>
                All Batches
                <span className="ml-2 rounded-md bg-white/20 px-2 py-0.5 text-xs">
                  {activeCount + archivedCount}
                </span>
              </Link>
            </Button>
          </div>
        }
      />

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Import Batches
            {showArchived ? (
              <Badge variant="secondary">Showing Active + Archived</Badge>
            ) : (
              <Badge>Showing Active Only</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Page {page} of {totalPages} • {totalBatches} matching batches
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <TableToolbar>
            <form
              method="GET"
              className="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-[1fr_180px_180px_220px_auto]"
            >
              <div>
                <label className="mb-2 block text-sm font-medium">Search</label>
                <Input
                  name="q"
                  defaultValue={q}
                  placeholder="Batch ID, school year, importer name or email"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">From</label>
                <Input name="dateFrom" type="date" defaultValue={dateFrom} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">To</label>
                <Input name="dateTo" type="date" defaultValue={dateTo} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">School Year</label>
                <select
                  name="schoolYearId"
                  defaultValue={schoolYearId}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="">All school years</option>
                  {schoolYears.map((schoolYear) => (
                    <option key={schoolYear.id} value={schoolYear.id}>
                      {schoolYear.name}
                    </option>
                  ))}
                </select>
              </div>

              <input
                type="hidden"
                name="archived"
                value={showArchived ? "1" : ""}
              />
              <input type="hidden" name="page" value="1" />

              <div className="flex items-end gap-2">
                <Button type="submit">Apply</Button>
                <Button type="button" variant="outline" asChild>
                  <Link
                    href={
                      showArchived
                        ? "/dashboard/admin/students/import-history?archived=1"
                        : "/dashboard/admin/students/import-history"
                    }
                  >
                    Reset
                  </Link>
                </Button>
              </div>
            </form>
          </TableToolbar>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Active Batches</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {activeCount}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Archived Batches</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {archivedCount}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Current View</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {showArchived ? "Active + Archived" : "Active Only"}
              </p>
            </div>
          </div>

          {q || dateFrom || dateTo || schoolYearId ? (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
              {q ? (
                <div>
                  Search:
                  <span className="ml-2 font-medium">{q}</span>
                </div>
              ) : null}
              {dateFrom || dateTo ? (
                <div className="mt-1">
                  Date range:
                  <span className="ml-2 font-medium">
                    {dateFrom || "Any"} → {dateTo || "Any"}
                  </span>
                </div>
              ) : null}
              {schoolYearId ? (
                <div className="mt-1">
                  School year:
                  <span className="ml-2 font-medium">
                    {schoolYears.find((s) => s.id === schoolYearId)?.name ?? schoolYearId}
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}

          {batches.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              No import history found.
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {batches.map((batch) => (
                  <div
                    key={batch.id}
                    className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">Batch ID</p>
                        {batch.isArchived ? (
                          <Badge variant="secondary">Archived</Badge>
                        ) : (
                          <Badge>Active</Badge>
                        )}
                      </div>

                      <p className="break-all font-mono text-sm text-slate-700">
                        {batch.id}
                      </p>
                      <p className="text-sm text-slate-500">
                        Students in batch: {batch._count.students}
                      </p>
                      <p className="text-sm text-slate-500">
                        School year: {batch.schoolYear?.name ?? "-"}
                      </p>
                      <p className="text-sm text-slate-500">
                        Imported by:{" "}
                        {batch.createdByUser?.name ??
                          batch.createdByUser?.email ??
                          "-"}
                      </p>
                      <p className="text-sm text-slate-500">
                        Imported at: {formatManilaDateTime(batch.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <CopyBatchIdButton value={batch.id} label="Copy Batch ID" />
                      <Button asChild variant="outline">
                        <a
                          href={`/api/students/export-batch?importBatchId=${encodeURIComponent(
                            batch.id
                          )}`}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Export Batch
                        </a>
                      </Button>

                      <Button asChild variant="outline">
                        <Link
                          href={`/dashboard/admin/students/import-history/${encodeURIComponent(
                            batch.id
                          )}`}
                        >
                          View Batch
                        </Link>
                      </Button>

                      <form action={toggleImportBatchArchive}>
                        <input type="hidden" name="batchId" value={batch.id} />
                        <Button type="submit" variant="outline">
                          {batch.isArchived ? "Unarchive" : "Archive"}
                        </Button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <Button variant="outline" asChild disabled={page <= 1}>
                  <Link href={buildUrl(page - 1)}>Previous</Link>
                </Button>

                <span className="text-sm text-slate-500">
                  Page {page} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  asChild
                  disabled={page >= totalPages}
                >
                  <Link href={buildUrl(page + 1)}>Next</Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}