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
import { toggleImportBatchArchive } from "./actions";
import CopyBatchIdButton from "@/components/copy-batch-id-button";
import ExportActionsMenu from "@/components/export-actions-menu";
import BatchCardActions from "./batch-card-actions";
import { buildImportHistoryExportUrl, buildImportHistoryPageExportUrl, buildImportHistoryPrintUrl, buildImportHistoryUrl } from "@/lib/student-url-builders";

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
    sectionId?: string;
    createdByUserId?: string;
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
  const sectionId = params.sectionId?.trim() ?? "";
  const createdByUserId = params.createdByUserId?.trim() ?? "";
  const page = Math.max(Number(params.page || "1"), 1);

  const createdAtRange = buildDateRange(dateFrom, dateTo);

  const baseWhere = {
    ...(showArchived ? {} : { isArchived: false }),
    ...(schoolYearId ? { schoolYearId } : {}),
    ...(createdByUserId ? { createdByUserId } : {}),
    ...(createdAtRange ? { createdAt: createdAtRange } : {}),
    ...(sectionId
      ? {
          students: {
            some: {
              sectionId,
            },
          },
        }
      : {}),
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
  };

  const [
    schoolYears,
    sections,
    importers,
    batches,
    totalBatches,
    allCounts,
    summaryRows,
  ] = await Promise.all([
    prisma.schoolYear.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.section.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        gradeLevel: true,
      },
    }),
    prisma.user.findMany({
      where: {
        studentImportBatches: {
          some: {},
        },
      },
      orderBy: [{ name: "asc" }, { email: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
      },
    }),
    prisma.studentImportBatch.findMany({
      where: baseWhere,
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
      where: baseWhere,
    }),
    prisma.studentImportBatch.groupBy({
      by: ["isArchived"],
      _count: {
        _all: true,
      },
    }),
    prisma.studentImportBatch.findMany({
      where: baseWhere,
      select: {
        isArchived: true,
        createdStudents: true,
        updatedStudents: true,
        skipped: true,
        _count: {
          select: {
            students: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.max(Math.ceil(totalBatches / PAGE_SIZE), 1);

  const activeCount =
    allCounts.find((row) => row.isArchived === false)?._count._all ?? 0;
  const archivedCount =
    allCounts.find((row) => row.isArchived === true)?._count._all ?? 0;

  const filteredBatchCount = summaryRows.length;
  const filteredStudentCount = summaryRows.reduce(
    (sum, row) => sum + row._count.students,
    0
  );
  const filteredCreatedStudents = summaryRows.reduce(
    (sum, row) => sum + row.createdStudents,
    0
  );
  const filteredUpdatedStudents = summaryRows.reduce(
    (sum, row) => sum + row.updatedStudents,
    0
  );
  const filteredSkipped = summaryRows.reduce(
    (sum, row) => sum + row.skipped,
    0
  );
  const filteredActiveCount = summaryRows.filter(
    (row) => row.isArchived === false
  ).length;
  const filteredArchivedCount = summaryRows.filter(
    (row) => row.isArchived === true
  ).length;

  function buildUrl(nextPage: number) {
    return buildImportHistoryUrl({
      archived: showArchived ? "1" : "",
      q,
      dateFrom,
      dateTo,
      schoolYearId,
      sectionId,
      createdByUserId,
      page: nextPage,
    });
  }

  function buildBaseUrl(archived: boolean) {
    return buildImportHistoryUrl({
      archived: archived ? "1" : "",
      q,
      dateFrom,
      dateTo,
      schoolYearId,
      sectionId,
      createdByUserId,
    });
  }

  function buildExportUrl() {
    return buildImportHistoryExportUrl({
      archived: showArchived ? "1" : "",
      q,
      dateFrom,
      dateTo,
      schoolYearId,
      sectionId,
      createdByUserId,
    });
  }

  function buildPageExportUrl() {
    return buildImportHistoryPageExportUrl({
      archived: showArchived ? "1" : "",
      q,
      dateFrom,
      dateTo,
      schoolYearId,
      sectionId,
      createdByUserId,
      page,
    });
  }

  function buildPrintUrl() {
    return buildImportHistoryPrintUrl({
      archived: showArchived ? "1" : "",
      q,
      dateFrom,
      dateTo,
      schoolYearId,
      sectionId,
      createdByUserId,
      page,
    });
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
            <ExportActionsMenu
              items={[
                { label: "Print View", href: buildPrintUrl(), icon: "print", newTab: true },
                { label: "Export This Page", href: buildPageExportUrl(), icon: "csv" },
                { label: "Export All Filtered", href: buildExportUrl(), icon: "csv" },
              ]}
            />

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
              className="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-[1fr_180px_180px_220px_220px_220px_auto]"
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

              <div>
                <label className="mb-2 block text-sm font-medium">Section</label>
                <select
                  name="sectionId"
                  defaultValue={sectionId}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="">All sections</option>
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Created By</label>
                <select
                  name="createdByUserId"
                  defaultValue={createdByUserId}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="">All importers</option>
                  {importers.map((importer) => (
                    <option key={importer.id} value={importer.id}>
                      {importer.name
                        ? `${importer.name} (${importer.email})`
                        : importer.email}
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

          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
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

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs text-blue-600">Filtered Batches</p>
              <p className="mt-1 text-lg font-semibold text-blue-950">
                {filteredBatchCount}
              </p>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs text-blue-600">Filtered Students</p>
              <p className="mt-1 text-lg font-semibold text-blue-950">
                {filteredStudentCount}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Current View</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {showArchived ? "Active + Archived" : "Active Only"}
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs text-emerald-700">Created Students</p>
              <p className="mt-1 text-lg font-semibold text-emerald-950">
                {filteredCreatedStudents}
              </p>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs text-amber-700">Updated Students</p>
              <p className="mt-1 text-lg font-semibold text-amber-950">
                {filteredUpdatedStudents}
              </p>
            </div>

            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-xs text-rose-700">Skipped Rows</p>
              <p className="mt-1 text-lg font-semibold text-rose-950">
                {filteredSkipped}
              </p>
            </div>

            <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
              <p className="text-xs text-sky-700">Filtered Active</p>
              <p className="mt-1 text-lg font-semibold text-sky-950">
                {filteredActiveCount}
              </p>
            </div>

            <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
              <p className="text-xs text-violet-700">Filtered Archived</p>
              <p className="mt-1 text-lg font-semibold text-violet-950">
                {filteredArchivedCount}
              </p>
            </div>
          </div>

          {q || dateFrom || dateTo || schoolYearId || sectionId || createdByUserId ? (
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
              {sectionId ? (
                <div className="mt-1">
                  Section:
                  <span className="ml-2 font-medium">
                    {sections.find((s) => s.id === sectionId)?.name ?? sectionId}
                  </span>
                </div>
              ) : null}
              {createdByUserId ? (
                <div className="mt-1">
                  Created by:
                  <span className="ml-2 font-medium">
                    {importers.find((u) => u.id === createdByUserId)?.name
                      ? `${importers.find((u) => u.id === createdByUserId)?.name} (${importers.find((u) => u.id === createdByUserId)?.email})`
                      : importers.find((u) => u.id === createdByUserId)?.email ??
                        createdByUserId}
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
                      <BatchCardActions batchId={batch.id} isArchived={batch.isArchived} />
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

                <Button variant="outline" asChild disabled={page >= totalPages}>
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