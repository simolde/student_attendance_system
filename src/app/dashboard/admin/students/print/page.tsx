import { auth } from "@/auth";
import PrintPage from "@/components/print/print-page";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect } from "next/navigation";

const PAGE_SIZE = 10;

function formatGradeLevel(value: string | null | undefined) {
  if (!value) return "-";
  return value.replace(/_/g, " ");
}

export default async function PrintStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    sectionId?: string;
    importBatchId?: string;
    rfidStatus?: string;
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
  const rfidStatus = params.rfidStatus?.trim() ?? "";
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
            schoolYear: {
              select: {
                name: true,
              },
            },
          },
        })
      : Promise.resolve(null),
  ]);

  const rfidCondition =
    rfidStatus === "WITH_RFID"
      ? { NOT: { rfidUid: null as string | null } }
      : rfidStatus === "WITHOUT_RFID"
        ? { rfidUid: null as string | null }
        : {};

  const where = {
    AND: [
      sectionId ? { sectionId } : {},
      importBatchId ? { importBatchId } : {},
      rfidCondition,
      q
        ? {
            OR: [
              { studentNo: { contains: q, mode: "insensitive" as const } },
              { rfidUid: { contains: q, mode: "insensitive" as const } },
              { user: { name: { contains: q, mode: "insensitive" as const } } },
              { user: { email: { contains: q, mode: "insensitive" as const } } },
              {
                section: {
                  name: { contains: q, mode: "insensitive" as const },
                },
              },
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

  const sectionName =
    sections.find((section) => section.id === sectionId)?.name ?? sectionId;

  const filterSummary = [
    q ? `Search: ${q}` : null,
    sectionId ? `Section: ${sectionName}` : null,
    rfidStatus
      ? `RFID Status: ${
          rfidStatus === "WITH_RFID"
            ? "With RFID"
            : rfidStatus === "WITHOUT_RFID"
              ? "Without RFID"
              : rfidStatus
        }`
      : null,
    selectedBatch ? `School Year: ${selectedBatch.schoolYear?.name ?? "-"}` : null,
    importBatchId
      ? `Import Batch: ${selectedBatch?.id ?? importBatchId}`
      : null,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <PrintPage
      title="Students"
      subtitle={
        [
          `Page ${page} of ${totalPages}`,
          `Total Students: ${totalStudents}`,
          `Printed by: ${session.user.name ?? session.user.email ?? "Admin"}`,
          filterSummary || null,
        ]
          .filter(Boolean)
          .join(" • ")
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Students on This Page</div>
            <div className="mt-1 text-2xl font-semibold">{students.length}</div>
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
                <th className="px-3 py-2 text-left font-semibold">RFID Status</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                    No students found.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="border-b">
                    <td className="px-3 py-2">{student.studentNo}</td>
                    <td className="px-3 py-2">{student.user.name ?? "-"}</td>
                    <td className="px-3 py-2">{student.user.email}</td>
                    <td className="px-3 py-2">{student.section?.name ?? "-"}</td>
                    <td className="px-3 py-2">
                      {formatGradeLevel(student.section?.gradeLevel)}
                    </td>
                    <td className="px-3 py-2">{student.rfidUid ?? "-"}</td>
                    <td className="px-3 py-2">
                      {student.rfidUid ? "WITH_RFID" : "WITHOUT_RFID"}
                    </td>
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