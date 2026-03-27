import { auth } from "@/auth";
import PrintPage from "@/components/print/print-page";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { notFound, redirect } from "next/navigation";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(value);
}

function formatGradeLevel(value: string | null | undefined) {
  if (!value) return "-";
  return value.replace(/_/g, " ");
}

export default async function PrintStudentImportBatchDetailsPage({
  params,
}: {
  params: Promise<{
    batchId: string;
  }>;
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
          {
            createdAt: "desc",
          },
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
    <PrintPage
      title="Student Import Batch Details"
      subtitle={[
        `Batch ID: ${batch.id}`,
        `School Year: ${batch.schoolYear?.name ?? "-"}`,
        `Created By: ${batch.createdByUser?.name ?? batch.createdByUser?.email ?? "-"}`,
        `Created At: ${formatDate(batch.createdAt)}`,
        `Status: ${batch.isArchived ? "Archived" : "Active"}`,
        `Printed by: ${session.user.name ?? session.user.email ?? "Admin"}`,
      ].join(" • ")}
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Total Rows</div>
            <div className="mt-1 text-2xl font-semibold">{batch.totalRows}</div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Created Students</div>
            <div className="mt-1 text-2xl font-semibold">{batch.createdStudents}</div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">With RFID</div>
            <div className="mt-1 text-2xl font-semibold">{withRfidCount}</div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Without RFID</div>
            <div className="mt-1 text-2xl font-semibold">{withoutRfidCount}</div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Created Users</div>
            <div className="mt-1 text-2xl font-semibold">{batch.createdUsers}</div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Created Enrollments</div>
            <div className="mt-1 text-2xl font-semibold">{batch.createdEnrollments}</div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Updated Users</div>
            <div className="mt-1 text-2xl font-semibold">{batch.updatedUsers}</div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Updated Students</div>
            <div className="mt-1 text-2xl font-semibold">{batch.updatedStudents}</div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Updated Enrollments</div>
            <div className="mt-1 text-2xl font-semibold">{batch.updatedEnrollments}</div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Skipped</div>
            <div className="mt-1 text-2xl font-semibold">{batch.skipped}</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-3 py-2 text-left font-semibold">Student No</th>
                <th className="px-3 py-2 text-left font-semibold">Name</th>
                <th className="px-3 py-2 text-left font-semibold">Email</th>
                <th className="px-3 py-2 text-left font-semibold">Section</th>
                <th className="px-3 py-2 text-left font-semibold">Grade Level</th>
                <th className="px-3 py-2 text-left font-semibold">RFID UID</th>
                <th className="px-3 py-2 text-left font-semibold">Created At</th>
              </tr>
            </thead>
            <tbody>
              {batch.students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                    No students found in this import batch.
                  </td>
                </tr>
              ) : (
                batch.students.map((student) => (
                  <tr key={student.id} className="border-b">
                    <td className="px-3 py-2">{student.studentNo}</td>
                    <td className="px-3 py-2">{student.user.name ?? "-"}</td>
                    <td className="px-3 py-2">{student.user.email}</td>
                    <td className="px-3 py-2">{student.section?.name ?? "-"}</td>
                    <td className="px-3 py-2">
                      {formatGradeLevel(student.section?.gradeLevel)}
                    </td>
                    <td className="px-3 py-2">{student.rfidUid ?? "-"}</td>
                    <td className="px-3 py-2">{formatDate(student.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PrintPage>
  );
}