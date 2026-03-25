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
import CopyBatchIdButton from "@/components/copy-batch-id-button";
import BatchDetailsActions from "./batch-details-actions";

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
  searchParams: Promise<{
    page?: string;
    q?: string;
    rfidStatus?: string;
    sectionId?: string;
  }>;
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
  const rfidStatus = sp.rfidStatus?.trim() ?? "";
  const sectionId = sp.sectionId?.trim() ?? "";

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
    return notFound();
  }

  const batchSections = await prisma.section.findMany({
    where: {
      students: {
        some: {
          importBatchId: batchId,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      gradeLevel: true,
    },
  });

  const rfidCondition =
    rfidStatus === "WITH_RFID"
      ? { NOT: { rfidUid: null as string | null } }
      : rfidStatus === "WITHOUT_RFID"
      ? { rfidUid: null as string | null }
      : {};

  const studentWhere = {
    AND: [
      { importBatchId: batchId },
      sectionId ? { sectionId } : {},
      rfidCondition,
      q
        ? {
            OR: [
              { studentNo: { contains: q, mode: "insensitive" as const } },
              { rfidUid: { contains: q, mode: "insensitive" as const } },
              { user: { name: { contains: q, mode: "insensitive" as const } } },
              { user: { email: { contains: q, mode: "insensitive" as const } } },
              { section: { name: { contains: q, mode: "insensitive" as const } } },
            ],
          }
        : {},
    ],
  };

  const [students, totalStudents, summaryRows] = await Promise.all([
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
    prisma.student.findMany({
      where: studentWhere,
      select: {
        id: true,
        rfidUid: true,
      },
    }),
  ]);

  const totalPages = Math.max(Math.ceil(totalStudents / PAGE_SIZE), 1);

  const withRfidCount = summaryRows.filter((student) => !!student.rfidUid).length;
  const withoutRfidCount = summaryRows.filter((student) => !student.rfidUid).length;

  function buildUrl(nextPage: number) {
    const qs = new URLSearchParams();
    qs.set("page", String(nextPage));
    if (q) qs.set("q", q);
    if (rfidStatus) qs.set("rfidStatus", rfidStatus);
    if (sectionId) qs.set("sectionId", sectionId);
    return `/dashboard/admin/students/import-history/${encodeURIComponent(
      batchId
    )}?${qs.toString()}`;
  }

  function buildBaseUrl() {
    return `/dashboard/admin/students/import-history/${encodeURIComponent(
      batchId
    )}`;
  }

  function buildExportStudentsUrl() {
    const qs = new URLSearchParams();
    qs.set("batchId", batch.id);
    if (q) qs.set("q", q);
    if (rfidStatus) qs.set("rfidStatus", rfidStatus);
    if (sectionId) qs.set("sectionId", sectionId);
    return `/api/students/export-batch-students?${qs.toString()}`;
  }

  function buildExportStudentsPageUrl() {
    const qs = new URLSearchParams();
    qs.set("batchId", batch.id);
    if (q) qs.set("q", q);
    if (rfidStatus) qs.set("rfidStatus", rfidStatus);
    if (sectionId) qs.set("sectionId", sectionId);
    qs.set("page", String(page));
    return `/api/students/export-batch-students-page?${qs.toString()}`;
  }

  function buildPrintUrl() {
    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    if (rfidStatus) qs.set("rfidStatus", rfidStatus);
    if (sectionId) qs.set("sectionId", sectionId);
    qs.set("page", String(page));
    return `/dashboard/admin/students/import-history/${encodeURIComponent(
      batch.id
    )}/print?${qs.toString()}`;
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
            <CopyBatchIdButton value={batch.id} />
            <BatchDetailsActions
              batchId={batch.id}
              isArchived={batch.isArchived}
              exportThisPageHref={buildExportStudentsPageUrl()}
              exportAllFilteredHref={buildExportStudentsUrl()}
              printViewHref={buildPrintUrl()}
            />
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
          <SummaryItem
            label="Batch ID"
            value={batch.id}
            mono
            extra={<CopyBatchIdButton value={batch.id} label="Copy" size="sm" />}
          />
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
              className="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-[1fr_220px_220px_auto]"
            >
              <div>
                <label className="mb-2 block text-sm font-medium">Search</label>
                <Input
                  name="q"
                  defaultValue={q}
                  placeholder="Student no, name, email, section, or RFID"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">RFID Status</label>
                <select
                  name="rfidStatus"
                  defaultValue={rfidStatus}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="">All students</option>
                  <option value="WITH_RFID">With RFID</option>
                  <option value="WITHOUT_RFID">Without RFID</option>
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
                  {batchSections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
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

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs text-blue-600">Matching Students</p>
              <p className="mt-1 text-lg font-semibold text-blue-950">
                {totalStudents}
              </p>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs text-emerald-700">With RFID</p>
              <p className="mt-1 text-lg font-semibold text-emerald-950">
                {withRfidCount}
              </p>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs text-amber-700">Without RFID</p>
              <p className="mt-1 text-lg font-semibold text-amber-950">
                {withoutRfidCount}
              </p>
            </div>
          </div>

          {q || rfidStatus || sectionId ? (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
              {q ? (
                <div>
                  Search:
                  <span className="ml-2 font-medium">{q}</span>
                </div>
              ) : null}
              {rfidStatus ? (
                <div className="mt-1">
                  RFID Status:
                  <span className="ml-2 font-medium">
                    {rfidStatus === "WITH_RFID"
                      ? "With RFID"
                      : rfidStatus === "WITHOUT_RFID"
                      ? "Without RFID"
                      : rfidStatus}
                  </span>
                </div>
              ) : null}
              {sectionId ? (
                <div className="mt-1">
                  Section:
                  <span className="ml-2 font-medium">
                    {batchSections.find((section) => section.id === sectionId)?.name ??
                      sectionId}
                  </span>
                </div>
              ) : null}
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
  extra,
}: {
  label: string;
  value: string;
  mono?: boolean;
  extra?: React.ReactNode;
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
      {extra ? <div className="mt-3">{extra}</div> : null}
    </div>
  );
}