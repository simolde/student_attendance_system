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

export default async function StudentImportHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string; q?: string }>;
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

  const [batches, allCounts] = await Promise.all([
    prisma.studentImportBatch.findMany({
      where: {
        ...(showArchived ? {} : { isArchived: false }),
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
    }),
    prisma.studentImportBatch.groupBy({
      by: ["isArchived"],
      _count: {
        _all: true,
      },
    }),
  ]);

  const activeCount =
    allCounts.find((row) => row.isArchived === false)?._count._all ?? 0;
  const archivedCount =
    allCounts.find((row) => row.isArchived === true)?._count._all ?? 0;

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
            <Button asChild variant={showArchived ? "outline" : "default"}>
              <Link href="/dashboard/admin/students/import-history">
                Active Batches
                <span className="ml-2 rounded-md bg-white/20 px-2 py-0.5 text-xs">
                  {activeCount}
                </span>
              </Link>
            </Button>

            <Button asChild variant={showArchived ? "default" : "outline"}>
              <Link href="/dashboard/admin/students/import-history?archived=1">
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
            Each batch groups students imported in the same upload run.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <TableToolbar>
            <form method="GET" className="grid flex-1 gap-4 md:grid-cols-[1fr_auto_auto]">
              <div>
                <label className="mb-2 block text-sm font-medium">Search</label>
                <Input
                  name="q"
                  defaultValue={q}
                  placeholder="Batch ID, school year, importer name or email"
                />
              </div>

              <input
                type="hidden"
                name="archived"
                value={showArchived ? "1" : ""}
              />

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

          {q ? (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
              Showing results for:
              <span className="ml-2 font-medium">{q}</span>
            </div>
          ) : null}

          {batches.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              No import history found.
            </div>
          ) : (
            batches.map((batch) => (
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
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}