import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { PRINT_PAGE_STYLES } from "@/lib/print-styles";
import { redirect } from "next/navigation";
import {
  PrintPage,
  PrintTitle,
  PrintFilters,
  PrintSummaryGrid,
  PrintSummaryCard,
} from "@/components/print/print-page";

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

  const sectionName =
    sections.find((section) => section.id === sectionId)?.name ?? sectionId;

  return (
    <PrintPage title="Print Students Page">
      <style>{PRINT_PAGE_STYLES}</style>

      <PrintTitle
        title="Students Directory"
        meta={
          <>
            <div>
              <strong>Page:</strong> {page} of {totalPages}
            </div>
            <div>
              <strong>Total matching students:</strong> {totalStudents}
            </div>
            <div>
              <strong>Printed by:</strong>{" "}
              {session.user.name ?? session.user.email ?? "Admin"}
            </div>
            {selectedBatch ? (
              <div>
                <strong>Batch:</strong> {selectedBatch.id}{" "}
                <span
                  className={`badge ${
                    selectedBatch.isArchived ? "archived" : "active"
                  }`}
                >
                  {selectedBatch.isArchived ? "ARCHIVED" : "ACTIVE"}
                </span>
              </div>
            ) : null}
          </>
        }
      />

      {q || sectionId || rfidStatus || importBatchId ? (
        <PrintFilters>
          {q ? <div>Search: {q}</div> : null}
          {sectionId ? <div>Section: {sectionName}</div> : null}
          {rfidStatus ? (
            <div>
              RFID Status:{" "}
              {rfidStatus === "WITH_RFID"
                ? "With RFID"
                : rfidStatus === "WITHOUT_RFID"
                ? "Without RFID"
                : rfidStatus}
            </div>
          ) : null}
          {selectedBatch ? (
            <div>School Year: {selectedBatch.schoolYear?.name ?? "-"}</div>
          ) : null}
        </PrintFilters>
      ) : null}

      <PrintSummaryGrid columns={3}>
        <PrintSummaryCard label="Students on This Page" value={students.length} />
        <PrintSummaryCard label="With RFID" value={withRfidCount} />
        <PrintSummaryCard label="Without RFID" value={withoutRfidCount} />
      </PrintSummaryGrid>

      <table>
        <thead>
          <tr>
            <th>Student No</th>
            <th>Name</th>
            <th>Email</th>
            <th>Section</th>
            <th>Grade Level</th>
            <th>RFID UID</th>
            <th>RFID Status</th>
          </tr>
        </thead>
        <tbody>
          {students.length === 0 ? (
            <tr>
              <td colSpan={7} className="muted">
                No students found.
              </td>
            </tr>
          ) : (
            students.map((student) => (
              <tr key={student.id}>
                <td>{student.studentNo}</td>
                <td>{student.user.name ?? "-"}</td>
                <td>{student.user.email}</td>
                <td>{student.section?.name ?? "-"}</td>
                <td>{formatGradeLevel(student.section?.gradeLevel)}</td>
                <td>{student.rfidUid ?? "-"}</td>
                <td>{student.rfidUid ? "WITH_RFID" : "WITHOUT_RFID"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </PrintPage>
  );
}