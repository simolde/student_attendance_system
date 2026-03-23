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
import { Download } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

  const students = await prisma.student.findMany({
    where: {
      importBatchId: batchId,
    },
    include: {
      user: true,
      section: true,
    },
    orderBy: {
      studentNo: "asc",
    },
  });

  if (students.length === 0) {
    notFound();
  }

  const latestUpdatedAt = students.reduce((latest, student) => {
    return student.updatedAt > latest ? student.updatedAt : latest;
  }, students[0].updatedAt);

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
                  batchId
                )}`}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Batch
              </a>
            </Button>

            <Button asChild variant="outline">
              <Link
                href={`/dashboard/admin/students?importBatchId=${encodeURIComponent(
                  batchId
                )}&page=1`}
              >
                View in Students Page
              </Link>
            </Button>
          </div>
        }
      />

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Batch Summary</CardTitle>
          <CardDescription>
            Basic information about this import batch.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Import Batch ID</p>
            <p className="mt-1 break-all font-mono text-sm font-semibold text-slate-900">
              {batchId}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Students in Batch</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {students.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Last Updated</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {formatManilaDateTime(latestUpdatedAt)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Students in This Batch</CardTitle>
          <CardDescription>
            All students tagged with this import batch ID.
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
                {students.map((student) => (
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