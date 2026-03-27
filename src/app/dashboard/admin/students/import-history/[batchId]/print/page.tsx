import { auth } from "@/auth";
import {
  PrintFilters,
  PrintPage,
  PrintSummaryCard,
  PrintSummaryGrid,
  PrintTitle,
} from "@/components/print/print-page";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { notFound, redirect } from "next/navigation";

const PAGE_SIZE = 25;

type SearchParams = Promise<{
  q?: string;
  page?: string;
  sectionId?: string;
  rfidStatus?: string;
}>;

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

export default async function PrintStudentImportBatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ batchId: string }>;
  searchParams: SearchParams;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasRole(session.user.role, [ROLES.SUPER_ADMIN, ROLES.ADMIN])) {
    redirect("/unauthorized");
  }

  const { batchId } = await params;
  const filters = await searchParams;

  const q = filters.q?.trim() ?? "";
  const sectionId = filters.sectionId?.trim() ?? "";
  const rfidStatus = filters.rfidStatus?.trim() ?? "all";
  const page = Math.max(Number(filters.page || "1"), 1);

  const batch = await prisma.studentImportBatch.findUnique({
    where: { id: batchId },
    include: {
      schoolYear: {
        select: {
          id: true,
          name: true,
        },
      },
      createdByUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          students: true,
        },
      },
    },
  });

  if (!batch) {
    notFound();
  }

  const studentWhere = {
    importBatchId: batchId,
    ...(sectionId ? { sectionId } : {}),
    ...(rfidStatus === "with-rfid"
      ? {
          rfidUid: {
            not: null,
          },
        }
      : rfidStatus === "without-rfid"
        ? {
            OR: [{ rfidUid: null }, { rfidUid: "" }],
          }
        : {}),
    ...(q
      ? {
          OR: [
            { id: { contains: q, mode: "insensitive" as const } },
            { studentNo: { contains: q, mode: "insensitive" as const } },
            { rfidUid: { contains: q, mode: "insensitive" as const } },
            {
              section: {
                name: { contains: q, mode: "insensitive" as const },
              },
            },
            {
              user: {
                name: { contains: q, mode: "insensitive" as const },
              },
            },
            {
              user: {
                email: { contains: q, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {}),
  };

  const [sections, students, totalStudents] = await Promise.all([
    prisma.section.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.student.findMany({
      where: studentWhere,
      include: {
        section: {
          select: {
            name: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ studentNo: "asc" }, { createdAt: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.student.count({
      where: studentWhere,
    }),
  ]);

  const totalPages = Math.max(Math.ceil(totalStudents / PAGE_SIZE), 1);

  const sectionName =
    sections.find((section) => section.id === sectionId)?.name ?? sectionId;

  const withRfidOnPage = students.filter(
    (student) => student.rfidUid && student.rfidUid.trim() !== "",
  ).length;

  const withoutRfidOnPage = students.length - withRfidOnPage;

  return (
    <PrintPage>
      <PrintTitle
        title="Import Batch Details"
        meta={
          <>
            <div>
              <strong>Batch ID:</strong> {batch.id}
            </div>
            <div>
              <strong>Status:</strong> {batch.isArchived ? "Archived" : "Active"}
            </div>
            <div>
              <strong>School Year:</strong> {batch.schoolYear?.name ?? "-"}
            </div>
            <div>
              <strong>Imported By:</strong>{" "}
              {batch.createdByUser?.name ?? batch.createdByUser?.email ?? "-"}
            </div>
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
          </>
        }
      />

      {q || sectionId || rfidStatus !== "all" ? (
        <PrintFilters>
          {q ? <div>Search: {q}</div> : null}

          {sectionId ? <div>Section: {sectionName}</div> : null}

          {rfidStatus !== "all" ? (
            <div>
              RFID Status:{" "}
              {rfidStatus === "with-rfid"
                ? "With RFID"
                : rfidStatus === "without-rfid"
                  ? "Without RFID"
                  : rfidStatus}
            </div>
          ) : null}
        </PrintFilters>
      ) : null}

      <PrintSummaryGrid columns={4}>
        <PrintSummaryCard
          label="Students on This Page"
          value={students.length}
        />
        <PrintSummaryCard label="With RFID" value={withRfidOnPage} />
        <PrintSummaryCard label="Without RFID" value={withoutRfidOnPage} />
        <PrintSummaryCard
          label="Total Matching Students"
          value={totalStudents}
        />
      </PrintSummaryGrid>

      <PrintSummaryGrid columns={4}>
        <PrintSummaryCard label="Batch Students" value={batch._count.students} />
        <PrintSummaryCard label="Total Rows" value={batch.totalRows} />
        <PrintSummaryCard
          label="Created Students"
          value={batch.createdStudents}
        />
        <PrintSummaryCard
          label="Updated Students"
          value={batch.updatedStudents}
        />
      </PrintSummaryGrid>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Student No</th>
            <th>User</th>
            <th>Email</th>
            <th>Section</th>
            <th>RFID UID</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
          {students.length === 0 ? (
            <tr>
              <td colSpan={7} className="muted">
                No students found for this batch and filter selection.
              </td>
            </tr>
          ) : (
            students.map((student, index) => {
              const displayIndex = (page - 1) * PAGE_SIZE + index + 1;

              return (
                <tr key={student.id}>
                  <td>{displayIndex}</td>
                  <td>{student.studentNo}</td>
                  <td>{student.user?.name ?? "-"}</td>
                  <td>{student.user?.email ?? "-"}</td>
                  <td>{student.section?.name ?? "-"}</td>
                  <td>{student.rfidUid?.trim() ? student.rfidUid : "-"}</td>
                  <td>{formatManilaDateTime(student.createdAt)}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </PrintPage>
  );
}