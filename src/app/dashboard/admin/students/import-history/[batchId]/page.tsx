import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect, notFound } from "next/navigation";
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
import { Download, TriangleAlert } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toggleImportBatchArchive } from "../actions";

const PAGE_SIZE = 20;

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
  searchParams,
}: {
  params: Promise<{ batchId: string }>;
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasRole(session.user.role, [ROLES.SUPER_ADMIN, ROLES.ADMIN])) {
    redirect("/unauthorized");
  }

  const [{ batchId }, sp] = await Promise.all([params, searchParams]);
  const page = Math.max(Number(sp.page || "1"), 1);
  const q = sp.q?.trim() ?? "";

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
    },
  });

  if (!batch) {
    notFound();
  }

  const studentWhere = {
    importBatchId: batchId,
    ...(q
      ? {
          OR: [
            { studentNo: { contains: q, mode: "insensitive" as const } },
            { rfidUid: { contains: q, mode: "insensitive" as const } },
            { user: { name: { contains: q, mode: "insensitive" as const } } },
            { user: { email: { contains: q, mode: "insensitive" as const } } },
            { section: { name: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [students, totalStudents] = await Promise.all([
    prisma.student.findMany({
      where: studentWhere,
      include: {
        user: true,
        section: true,
      },
      orderBy: {
        studentNo: "asc",
      },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.student.count({
      where: studentWhere,
    }),
  ]);

  const totalPages = Math.max(Math.ceil(totalStudents / PAGE_SIZE), 1);

  function buildUrl(nextPage: number) {
    const qs = new URLSearchParams();
    qs.set("page", String(nextPage));
    if (q) qs.set("q", q);
    return `/dashboard/admin/students/import-history/${encodeURIComponent(
      batchId
    )}?${qs.toString()}`;
  }

  function buildBaseUrl() {
    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    return `/dashboard/admin/students/import-history/${encodeURIComponent(
      batchId
    )}${qs.toString() ? `?${qs.toString()}` : ""}`;
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
          {
            label: "Import History",
            href: "/dashboard/admin/students/import-history",
          },
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

      {batch.isArchived ? (
        <Card className="border-amber-200 bg-amber-50 shadow-sm">
          <CardContent className="flex items-start gap-3 p-5">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-amber-950">
                  Archived import batch
                </p>
                <Badge variant="secondary">Archived</Badge>
              </div>
              <p className="text-sm text-amber-900">
                This batch is kept for history and audit purposes. It is excluded
                from current-flow features like{" "}
                <span className="font-medium">Export Latest Import</span>, but
                batch-specific export is still allowed from this page.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-blue-200 bg-blue-50 shadow-sm">
          <CardContent className="flex items-start gap-3 p-5">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-blue-950">
                  Active import batch
                </p>
                <Badge>Active</Badge>
              </div>
              <p className="text-sm text-blue-900">
                This batch is active and still part of normal review and export
                flows.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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
          <SummaryItem
            label="Imported At"
            value={formatManilaDateTime(batch.createdAt)}
          />
          <SummaryItem label="Total Rows" value={String(batch.totalRows)} />
          <SummaryItem label="Created Users" value={String(batch.createdUsers)} />
          <SummaryItem
            label="Created Students"
            value={String(batch.createdStudents)}
          />
          <SummaryItem
            label="Created Enrollments"
            value={String(batch.createdEnrollments)}
          />
          <SummaryItem label="Updated Users" value={String(batch.updatedUsers)} />
          <SummaryItem
            label="Updated Students"
            value={String(batch.updatedStudents)}
          />
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
          <SummaryItem
            label="Matching Students"
            value={String(totalStudents)}
          />
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Students in This Batch</CardTitle>
          <CardDescription>
            Page {page} of {totalPages} • {totalStudents} matching students
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <TableToolbar>
            <form
              method="GET"
              className="grid flex-1 gap-4 md:grid-cols-[1fr_auto_auto]"
            >
              <div>
                <label className="mb-2 block text-sm font-medium">Search</label>
                <Input
                  name="q"
                  defaultValue={q}
                  placeholder="Student no, name, email, section, or RFID"
                />
              </div>

              <input type="hidden" name="page" value="1" />

              <div className="flex items-end gap-2">
                <Button type="submit">Apply</Button>
                <Button type="button" variant="outline" asChild>
                  <Link href={buildBaseUrl()}>Reset</Link>
                </Button>
              </div>
            </form>
          </TableToolbar>

          {q ? (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
              Showing results for:
              <span className="ml-2 font-medium">{q}</span>
            </div>
          ) : null}

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
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-sm text-slate-500"
                    >
                      No students found for this batch.
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => (
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
                  ))
                )}
              </TableBody>
            </Table>
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