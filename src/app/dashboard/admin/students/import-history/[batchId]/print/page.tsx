import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect, notFound } from "next/navigation";

const PAGE_SIZE = 20;

function formatGradeLevel(value: string | null | undefined) {
  if (!value) return "-";
  return value.replace(/_/g, " ");
}

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

export default async function PrintBatchStudentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ batchId: string }>;
  searchParams: Promise<{
    q?: string;
    rfidStatus?: string;
    sectionId?: string;
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

  const [{ batchId }, sp] = await Promise.all([params, searchParams]);
  const q = sp.q?.trim() ?? "";
  const rfidStatus = sp.rfidStatus?.trim() ?? "";
  const sectionId = sp.sectionId?.trim() ?? "";
  const page = Math.max(Number(sp.page || "1"), 1);

  const batch = await prisma.studentImportBatch.findUnique({
    where: { id: batchId },
    include: {
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
    },
  });

  const rfidCondition =
    rfidStatus === "WITH_RFID"
      ? { NOT: { rfidUid: null as string | null } }
      : rfidStatus === "WITHOUT_RFID"
      ? { rfidUid: null as string | null }
      : {};

  const where = {
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
      where,
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
    batchSections.find((section) => section.id === sectionId)?.name ?? sectionId;

  return (
    <html>
      <head>
        <title>Print Batch Students</title>
        <style>{`
          * { box-sizing: border-box; }
          body {
            font-family: Arial, Helvetica, sans-serif;
            margin: 24px;
            color: #0f172a;
          }
          h1 {
            margin: 0 0 8px 0;
            font-size: 24px;
          }
          .meta {
            margin-bottom: 16px;
            font-size: 13px;
            line-height: 1.6;
          }
          .filters {
            margin: 16px 0 20px;
            padding: 12px;
            border: 1px solid #cbd5e1;
            background: #f8fafc;
            border-radius: 8px;
            font-size: 12px;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 12px;
            margin-bottom: 20px;
          }
          .summary-card {
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 12px;
            background: #fff;
          }
          .summary-card .label {
            font-size: 11px;
            color: #475569;
            margin-bottom: 6px;
          }
          .summary-card .value {
            font-size: 18px;
            font-weight: bold;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }
          th, td {
            border: 1px solid #cbd5e1;
            padding: 8px;
            text-align: left;
            vertical-align: top;
          }
          th {
            background: #e2e8f0;
          }
          .muted {
            color: #475569;
          }
          .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: bold;
            border: 1px solid #cbd5e1;
          }
          .badge.active {
            background: #dbeafe;
            color: #1e3a8a;
          }
          .badge.archived {
            background: #f1f5f9;
            color: #334155;
          }
          .print-actions {
            margin-bottom: 18px;
          }
          .print-actions button {
            padding: 8px 12px;
            border: 1px solid #cbd5e1;
            background: white;
            border-radius: 8px;
            cursor: pointer;
          }
          @media print {
            .print-actions { display: none; }
            body { margin: 0; }
          }
        `}</style>
      </head>
      <body>
        <div className="print-actions">
          <button onClick={() => window.print()}>Print</button>
        </div>

        <h1>Batch Students</h1>

        <div className="meta">
          <div>
            <strong>Batch ID:</strong> {batch.id}
          </div>
          <div>
            <strong>Status:</strong>{" "}
            <span className={`badge ${batch.isArchived ? "archived" : "active"}`}>
              {batch.isArchived ? "ARCHIVED" : "ACTIVE"}
            </span>
          </div>
          <div>
            <strong>School Year:</strong> {batch.schoolYear?.name ?? "-"}
          </div>
          <div>
            <strong>Imported At:</strong> {formatManilaDateTime(batch.createdAt)}
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
        </div>

        {q || rfidStatus || sectionId ? (
          <div className="filters">
            <div><strong>Applied Filters</strong></div>
            {q ? <div>Search: {q}</div> : null}
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
            {sectionId ? <div>Section: {sectionName}</div> : null}
          </div>
        ) : null}

        <div className="summary-grid">
          <div className="summary-card">
            <div className="label">Students on This Page</div>
            <div className="value">{students.length}</div>
          </div>
          <div className="summary-card">
            <div className="label">With RFID</div>
            <div className="value">{withRfidCount}</div>
          </div>
          <div className="summary-card">
            <div className="label">Without RFID</div>
            <div className="value">{withoutRfidCount}</div>
          </div>
        </div>

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
                <td colSpan={7} className="muted">No students found.</td>
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
      </body>
    </html>
  );
}