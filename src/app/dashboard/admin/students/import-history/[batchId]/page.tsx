import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import DashboardTopbar from "@/components/layout/dashboard-topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  History,
  School,
  UserCircle2,
  CalendarDays,
  CheckCircle2,
  RefreshCcw,
  SkipForward,
  Radio,
  Archive,
  Users,
} from "lucide-react";

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(value);
}

function formatGradeLevel(value: string | null | undefined) {
  if (!value) return "-";
  return value.replaceAll("_", " ");
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
      schoolYear: {
        select: {
          name: true,
        },
      },
      createdByUser: {
        select: {
          name: true,
          email: true,
        },
      },
      students: {
        include: {
          user: true,
          section: true,
        },
        orderBy: [
          { createdAt: "desc" },
          { studentNo: "asc" },
        ],
      },
    },
  });

  if (!batch) {
    notFound();
  }

  const withRfidCount = batch.students.filter((student) => !!student.rfidUid).length;
  const withoutRfidCount = batch.students.filter((student) => !student.rfidUid).length;

  return (
    <div className="portal-shell space-y-6">
      <DashboardTopbar
        title="Import Batch Details"
        subtitle="Review one student import batch and its imported student records."
        userName={session.user.name ?? session.user.email}
      />

      <section className="portal-card overflow-hidden border-0 p-0">
        <div className="portal-hero relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_28%)]" />
          <div className="relative grid gap-6 px-6 py-8 md:px-8 md:py-10 xl:grid-cols-[1.45fr_0.95fr]">
            <div className="space-y-4 text-white">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                Import Batch Details
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Review student import batch results
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-blue-50/90 md:text-base">
                  Inspect the school year, admin, imported students, RFID assignment,
                  and summary counts for this import batch.
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <div className="text-xs uppercase tracking-[0.16em] text-blue-100/80">
                  Batch ID
                </div>
                <div className="mt-2 break-all text-sm font-semibold md:text-base">
                  {batch.id}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <School className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    School Year
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">
                  {batch.schoolYear?.name ?? "-"}
                </div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <UserCircle2 className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Created By
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">
                  {batch.createdByUser?.name ?? batch.createdByUser?.email ?? "-"}
                </div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <CalendarDays className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Created At
                  </span>
                </div>
                <div className="mt-2 text-sm font-semibold md:text-base">
                  {formatDateTime(batch.createdAt)}
                </div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <Archive className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Status
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">
                  {batch.isArchived ? "ARCHIVED" : "ACTIVE"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card className="portal-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <History className="h-4 w-4 text-slate-600" />
              Total Rows
            </div>
            <div className="mt-2 text-3xl font-bold text-slate-900">
              {batch.totalRows}
            </div>
          </CardContent>
        </Card>

        <Card className="portal-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Created Students
            </div>
            <div className="mt-2 text-3xl font-bold text-slate-900">
              {batch.createdStudents}
            </div>
          </CardContent>
        </Card>

        <Card className="portal-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <RefreshCcw className="h-4 w-4 text-sky-600" />
              Updated Students
            </div>
            <div className="mt-2 text-3xl font-bold text-slate-900">
              {batch.updatedStudents}
            </div>
          </CardContent>
        </Card>

        <Card className="portal-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <SkipForward className="h-4 w-4 text-amber-600" />
              Skipped
            </div>
            <div className="mt-2 text-3xl font-bold text-slate-900">
              {batch.skipped}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card className="portal-card">
          <CardContent className="p-5">
            <div className="text-sm text-slate-500">Created Users</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">
              {batch.createdUsers}
            </div>
          </CardContent>
        </Card>

        <Card className="portal-card">
          <CardContent className="p-5">
            <div className="text-sm text-slate-500">Created Enrollments</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">
              {batch.createdEnrollments}
            </div>
          </CardContent>
        </Card>

        <Card className="portal-card">
          <CardContent className="p-5">
            <div className="text-sm text-slate-500">With RFID</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">
              {withRfidCount}
            </div>
          </CardContent>
        </Card>

        <Card className="portal-card">
          <CardContent className="p-5">
            <div className="text-sm text-slate-500">Without RFID</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">
              {withoutRfidCount}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="portal-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
            <Users className="h-5 w-5 text-slate-700" />
            Imported Students
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="px-4 py-3 text-left font-medium text-slate-700">
                      Student No
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">
                      Student
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">
                      Section
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">
                      Grade Level
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">
                      RFID UID
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">
                      Created At
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {batch.students.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-10 text-center text-sm text-muted-foreground"
                      >
                        No students found in this batch.
                      </td>
                    </tr>
                  ) : (
                    batch.students.map((student) => (
                      <tr key={student.id} className="border-t border-slate-100">
                        <td className="px-4 py-4 font-medium text-slate-900">
                          {student.studentNo}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {student.user.name ?? "-"}
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          {student.user.email}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {student.section?.name ?? "-"}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {formatGradeLevel(student.section?.gradeLevel)}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                              student.rfidUid
                                ? "border-green-200 bg-green-50 text-green-700"
                                : "border-slate-200 bg-slate-50 text-slate-700"
                            }`}
                          >
                            {student.rfidUid ?? "NO RFID"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {formatDateTime(student.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}