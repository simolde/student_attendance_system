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
import { Download } from "lucide-react";

type BatchRow = {
  importBatchId: string;
  count: number;
  latestUpdatedAt: Date;
};

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

export default async function StudentImportHistoryPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasRole(session.user.role, [ROLES.SUPER_ADMIN, ROLES.ADMIN])) {
    redirect("/unauthorized");
  }

  const students = await prisma.student.findMany({
    where: {
      importBatchId: {
        not: null,
      },
    },
    select: {
      importBatchId: true,
      updatedAt: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const batchMap = new Map<string, BatchRow>();

  for (const student of students) {
    if (!student.importBatchId) continue;

    const existing = batchMap.get(student.importBatchId);

    if (!existing) {
      batchMap.set(student.importBatchId, {
        importBatchId: student.importBatchId,
        count: 1,
        latestUpdatedAt: student.updatedAt,
      });
      continue;
    }

    existing.count += 1;

    if (student.updatedAt > existing.latestUpdatedAt) {
      existing.latestUpdatedAt = student.updatedAt;
    }
  }

  const batches = Array.from(batchMap.values()).sort(
    (a, b) => b.latestUpdatedAt.getTime() - a.latestUpdatedAt.getTime()
  );

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
                key={batch.importBatchId}
                className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-1">
                  <p className="font-semibold text-slate-900">Batch ID</p>
                  <p className="break-all font-mono text-sm text-slate-700">
                    {batch.importBatchId}
                  </p>
                  <p className="text-sm text-slate-500">
                    Students in batch: {batch.count}
                  </p>
                  <p className="text-sm text-slate-500">
                    Last updated: {formatManilaDateTime(batch.latestUpdatedAt)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline">
                    <a
                      href={`/api/students/export-batch?importBatchId=${encodeURIComponent(
                        batch.importBatchId
                      )}`}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export Batch
                    </a>
                  </Button>

                  <Button asChild variant="outline">
                    <Link
                      href={`/dashboard/admin/students?q=&page=1`}
                    >
                      View Students
                    </Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}