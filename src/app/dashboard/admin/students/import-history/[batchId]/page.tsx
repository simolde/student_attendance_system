import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect, notFound } from "next/navigation";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toggleImportBatchArchive } from "../actions";

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

function formatGradeLevel(value: string | null | undefined) {
  if (!value) return "-";
  return value.replace(/_/g, " ");
}

export default async function StudentImportBatchDetailsPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasRole(session.user.role, [ROLES.SUPER_ADMIN, ROLES.ADMIN])) {
    redirect("/unauthorized");
  }

  const { batchId } = await params;

  const batch = await prisma.studentImportBatch.findUnique({
    where: { id: batchId },
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
      students: {
        include: {
          user: true,
          section: true,
        },
        orderBy: {
          studentNo: "asc",
        },
      },
    },
  });

  if (!batch) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Import Batch Details"
        description="Review a specific student import batch and export credentials again if needed."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin", href: "/dashboard/admin" },
          { label: "Student Management", href: "/dashboard/admin/students" },
          { label: "Import History", href: "/dashboard/admin/students/import-history" },
          { label: "Batch Details" },
        ]}
        actions={
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
                href={`/dashboard/admin/students?importBatchId=${encodeURIComponent(
                  batch.id
                )}&page=1`}
              >
                View in Students Page
              </Link>
            </Button>

            <form action={toggleImportBatchArchive}>
              <input type="hidden" name="batchId" value={batch.id} />
              <Button type="submit" variant="outline">
                {batch.isArchived ? "Unarchive" : "Archive"}
              </Button>
            </form>
          </div>
        }
      />

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Batch Summary</CardTitle>
          <CardDescription>
            Stored batch information from the import run.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryItem label="Batch ID" value={batch.id} mono />
          <SummaryItem label="School Year" value={batch.schoolYear?.name ?? "-"} />
          <SummaryItem
            label="Imported By"
            value={batch.createdByUser?.name ?? batch.createdByUser?.email ?? "-"}
          />
          <SummaryItem label="Imported At" value={formatManilaDateTime(batch.createdAt)} />
          <SummaryItem label="Total Rows" value={String(batch.totalRows)} />
          <SummaryItem label="Created Users" value={String(batch.createdUsers)} />
          <SummaryItem label="Created Students" value={String(batch.createdStudents)} />
          <SummaryItem
            label="Created Enrollments"
            value={String(batch.createdEnrollments)}
          />
          <SummaryItem label="Updated Users" value={String(batch.updatedUsers)} />
          <SummaryItem label="Updated Students" value={String(batch.updatedStudents)} />
          <SummaryItem
            label="Updated Enrollments"
            value={String(batch.updatedEnrollments)}
          />
          <SummaryItem label="Skipped" value={String(batch.skipped)} />
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Status</p>
            <div className="mt-1">
              {batch.isArchived ? (
                <Badge variant="secondary">Archived</Badge>
              ) : (
                <Badge>Active</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Students in This Batch</CardTitle>
          <CardDescription>
            All students tagged with this import batch.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead>Student No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Grade Level</TableHead>
                  <TableHead>RFID UID</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {batch.students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium text-slate-900">
                      {student.studentNo}
                    </TableCell>
                    <TableCell>{student.user.name ?? "-"}</TableCell>
                    <TableCell className="text-slate-600">
                      {student.user.email}
                    </TableCell>
                    <TableCell>{student.section?.name ?? "-"}</TableCell>
                    <TableCell>
                      {formatGradeLevel(student.section?.gradeLevel)}
                    </TableCell>
                    <TableCell>{student.rfidUid ?? "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p
        className={`mt-1 text-sm font-semibold text-slate-900 ${
          mono ? "break-all font-mono" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}