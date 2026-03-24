import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect } from "next/navigation";
import Link from "next/link";
import StudentManagementForms from "./forms";
import PageHeader from "@/components/layout/page-header";
import TableToolbar from "@/components/layout/table-toolbar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, TriangleAlert } from "lucide-react";

const PAGE_SIZE = 10;

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    sectionId?: string;
    importBatchId?: string;
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
  const sectionId = params.sectionId?.trim() ?? "";
  const importBatchId = params.importBatchId?.trim() ?? "";
  const page = Math.max(Number(params.page || "1"), 1);

  const [sections, selectedBatch] = await Promise.all([
    prisma.section.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        gradeLevel: true,
      },
    }),
    importBatchId
      ? prisma.studentImportBatch.findUnique({
          where: { id: importBatchId },
          select: {
            id: true,
            isArchived: true,
            createdAt: true,
            schoolYear: {
              select: {
                name: true,
              },
            },
          },
        })
      : Promise.resolve(null),
  ]);

  const isArchivedBatchView = Boolean(importBatchId && selectedBatch?.isArchived);

  const where = {
    AND: [
      sectionId ? { sectionId } : {},
      importBatchId ? { importBatchId } : {},
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
      where,
      include: {
        user: true,
        section: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.student.count({ where }),
    prisma.student.findMany({
      where,
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
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (sectionId) sp.set("sectionId", sectionId);
    if (importBatchId) sp.set("importBatchId", importBatchId);
    sp.set("page", String(nextPage));
    return `/dashboard/admin/students?${sp.toString()}`;
  }

  function buildExportUrl() {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (sectionId) sp.set("sectionId", sectionId);
    if (importBatchId) sp.set("importBatchId", importBatchId);
    return `/api/students/export-credentials?${sp.toString()}`;
  }

  function buildViewExportUrl() {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (sectionId) sp.set("sectionId", sectionId);
    if (importBatchId) sp.set("importBatchId", importBatchId);
    return `/api/students/export-students-view?${sp.toString()}`;
  }

  const formatName = (name: string) =>
    name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="space-y-8">
      <PageHeader
        title="Student Management"
        description="Manage sections and student records from one place."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin", href: "/dashboard/admin" },
          { label: "Student Management" },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            {importBatchId ? (
              <Button asChild variant="outline">
                <a href={buildViewExportUrl()}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Students View
                </a>
              </Button>
            ) : null}

            {isArchivedBatchView ? (
              <Button type="button" variant="outline" disabled>
                <Download className="mr-2 h-4 w-4" />
                Export Credentials Disabled
              </Button>
            ) : (
              <Button asChild variant="outline">
                <a href={buildExportUrl()}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Credentials
                </a>
              </Button>
            )}
          </div>
        }
      />

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle>Manage Students and Sections</CardTitle>
          <CardDescription>
            Create sections and add students to their assigned class.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StudentManagementForms sections={sections} />
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle>Sections</CardTitle>
          <CardDescription>Available class and section list.</CardDescription>
        </CardHeader>
        <CardContent>
          {sections.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              No sections yet.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {sections.map((section) => (
                <div
                  key={section.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <p className="font-medium text-slate-900">{section.name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatName(section.gradeLevel)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle>Students Directory</CardTitle>
          <CardDescription>
            Page {page} of {totalPages} • {totalStudents} matching students
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <TableToolbar>
            <form method="GET" className="grid flex-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium">Search</label>
                <Input
                  name="q"
                  defaultValue={q}
                  placeholder="Name, email, student number, section, or RFID"
                />
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

              <input type="hidden" name="importBatchId" value={importBatchId} />
              <input type="hidden" name="page" value="1" />

              <div className="flex items-end gap-2">
                <Button type="submit">Apply</Button>
                <Button type="button" variant="outline" asChild>
                  <Link
                    href={
                      importBatchId
                        ? `/dashboard/admin/students?importBatchId=${encodeURIComponent(
                            importBatchId
                          )}`
                        : "/dashboard/admin/students"
                    }
                  >
                    Reset
                  </Link>
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

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            Exported credentials only include the login email and the temporary
            password policy. They do not read plain passwords from the database.
          </div>

          {q || sectionId ? (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
              {q ? (
                <div>
                  Search:
                  <span className="ml-2 font-medium">{q}</span>
                </div>
              ) : null}
              {sectionId ? (
                <div className="mt-1">
                  Section:
                  <span className="ml-2 font-medium">
                    {sections.find((section) => section.id === sectionId)?.name ??
                      sectionId}
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}

          {importBatchId && selectedBatch ? (
            <div
              className={`rounded-xl border p-4 text-sm ${
                selectedBatch.isArchived
                  ? "border-amber-200 bg-amber-50 text-amber-950"
                  : "border-blue-200 bg-blue-50 text-blue-950"
              }`}
            >
              <div className="flex items-start gap-3">
                <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">
                      Viewing students from import batch
                    </p>
                    {selectedBatch.isArchived ? (
                      <Badge variant="secondary">Archived</Badge>
                    ) : (
                      <Badge>Active Batch</Badge>
                    )}
                  </div>

                  <p className="break-all font-mono text-xs">{selectedBatch.id}</p>

                  <p>School year: {selectedBatch.schoolYear?.name ?? "-"}</p>

                  {selectedBatch.isArchived ? (
                    <p>
                      This batch is archived and excluded from{" "}
                      <span className="font-medium">Export Latest Import</span>.
                      The general <span className="font-medium">Export Credentials</span>{" "}
                      button is disabled in this archived batch view. You can still
                      use <span className="font-medium">Export Students View</span>{" "}
                      to export the currently filtered student list.
                    </p>
                  ) : (
                    <p>
                      This batch is active and can still be used in normal export
                      and review flows.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {students.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              No students found.
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80">
                      <TableHead>Student No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Section</TableHead>
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
                      </TableRow>
                    ))}
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}