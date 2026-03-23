import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  searchParams: Promise<{ archived?: string }>;
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

  const batches = await prisma.studentImportBatch.findMany({
    where: showArchived ? {} : { isArchived: false },
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
  });

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
          <Button asChild variant="outline">
            <Link
              href={
                showArchived
                  ? "/dashboard/admin/students/import-history"
                  : "/dashboard/admin/students/import-history?archived=1"
              }
            >
              {showArchived ? "Hide Archived" : "Show Archived"}
            </Link>
          </Button>
        }
      />

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Import Batches</CardTitle>
          <CardDescription>
            Each batch groups students imported in the same upload run.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
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
                    ) : null}
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
                    Imported by: {batch.createdByUser?.name ?? batch.createdByUser?.email ?? "-"}
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