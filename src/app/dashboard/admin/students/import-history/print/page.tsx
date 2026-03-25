import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect } from "next/navigation";

const PAGE_SIZE = 10;

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

function buildDateRange(dateFrom: string, dateTo: string) {
  const createdAt: { gte?: Date; lte?: Date } = {};

  if (dateFrom) {
    createdAt.gte = new Date(`${dateFrom}T00:00:00.000+08:00`);
  }

  if (dateTo) {
    createdAt.lte = new Date(`${dateTo}T23:59:59.999+08:00`);
  }

  return Object.keys(createdAt).length > 0 ? createdAt : undefined;
}

export default async function PrintStudentImportHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    archived?: string;
    q?: string;
    page?: string;
    dateFrom?: string;
    dateTo?: string;
    schoolYearId?: string;
    sectionId?: string;
    createdByUserId?: string;
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
  const showArchived = params.archived === "1";
  const q = params.q?.trim() ?? "";
  const dateFrom = params.dateFrom?.trim() ?? "";
  const dateTo = params.dateTo?.trim() ?? "";
  const schoolYearId = params.schoolYearId?.trim() ?? "";
  const sectionId = params.sectionId?.trim() ?? "";
  const createdByUserId = params.createdByUserId?.trim() ?? "";
  const page = Math.max(Number(params.page || "1"), 1);

  const createdAtRange = buildDateRange(dateFrom, dateTo);

  const baseWhere = {
    ...(showArchived ? {} : { isArchived: false }),
    ...(schoolYearId ? { schoolYearId } : {}),
    ...(createdByUserId ? { createdByUserId } : {}),
    ...(createdAtRange ? { createdAt: createdAtRange } : {}),
    ...(sectionId
      ? {
          students: {
            some: {
              sectionId,
            },
          },
        }
      : {}),
    ...(q
      ? {
          OR: [
            { id: { contains: q, mode: "insensitive" as const } },
            {
              schoolYear: {
                name: { contains: q, mode: "insensitive" as const },
              },
            },
            {
              createdByUser: {
                name: { contains: q, mode: "insensitive" as const },
              },
            },
            {
              createdByUser: {
                email: { contains: q, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {}),
  };

  const [schoolYears, sections, importers, batches, totalBatches] =
    await Promise.all([
      prisma.schoolYear.findMany({
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true },
      }),
      prisma.section.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.user.findMany({
        where: {
          studentImportBatches: {
            some: {},
          },
        },
        orderBy: [{ name: "asc" }, { email: "asc" }],
        select: {
          id: true,
          name: true,
          email: true,
        },
      }),
      prisma.studentImportBatch.findMany({
        where: baseWhere,
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
          _count: {
            select: {
              students: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.studentImportBatch.count({
        where: baseWhere,
      }),
    ]);

  const totalPages = Math.max(Math.ceil(totalBatches / PAGE_SIZE), 1);

  const schoolYearName =
    schoolYears.find((s) => s.id === schoolYearId)?.name ?? schoolYearId;
  const sectionName =
    sections.find((s) => s.id === sectionId)?.name ?? sectionId;
  const importer = importers.find((u) => u.id === createdByUserId);

  return (
    <html>
      <head>
        <title>Print Import History</title>
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
            grid-template-columns: repeat(4, minmax(0, 1fr));
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
            .print-actions {
              display: none;
            }
            body {
              margin: 0;
            }
          }
        `}</style>
      </head>
      <body>
        <div className="print-actions">
          <button onClick={() => window.print()}>Print</button>
        </div>

        <h1>Student Import History</h1>

        <div className="meta">
          <div>
            <strong>View:</strong>{" "}
            {showArchived ? "Active + Archived" : "Active Only"}
          </div>
          <div>
            <strong>Page:</strong> {page} of {totalPages}
          </div>
          <div>
            <strong>Total matching batches:</strong> {totalBatches}
          </div>
          <div>
            <strong>Printed by:</strong>{" "}
            {session.user.name ?? session.user.email ?? "Admin"}
          </div>
        </div>

        {q || dateFrom || dateTo || schoolYearId || sectionId || createdByUserId ? (
          <div className="filters">
            <div><strong>Applied Filters</strong></div>
            {q ? <div>Search: {q}</div> : null}
            {dateFrom || dateTo ? (
              <div>
                Date range: {dateFrom || "Any"} → {dateTo || "Any"}
              </div>
            ) : null}
            {schoolYearId ? <div>School year: {schoolYearName}</div> : null}
            {sectionId ? <div>Section: {sectionName}</div> : null}
            {createdByUserId ? (
              <div>
                Created by:{" "}
                {importer?.name
                  ? `${importer.name} (${importer.email})`
                  : importer?.email ?? createdByUserId}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="summary-grid">
          <div className="summary-card">
            <div className="label">Batches on This Page</div>
            <div className="value">{batches.length}</div>
          </div>
          <div className="summary-card">
            <div className="label">Students on This Page</div>
            <div className="value">
              {batches.reduce((sum, batch) => sum + batch._count.students, 0)}
            </div>
          </div>
          <div className="summary-card">
            <div className="label">Created Students</div>
            <div className="value">
              {batches.reduce((sum, batch) => sum + batch.createdStudents, 0)}
            </div>
          </div>
          <div className="summary-card">
            <div className="label">Updated Students</div>
            <div className="value">
              {batches.reduce((sum, batch) => sum + batch.updatedStudents, 0)}
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Batch ID</th>
              <th>Status</th>
              <th>School Year</th>
              <th>Imported By</th>
              <th>Imported At</th>
              <th>Students</th>
              <th>Created</th>
              <th>Updated</th>
              <th>Skipped</th>
            </tr>
          </thead>
          <tbody>
            {batches.length === 0 ? (
              <tr>
                <td colSpan={9} className="muted">
                  No import history found.
                </td>
              </tr>
            ) : (
              batches.map((batch) => (
                <tr key={batch.id}>
                  <td>{batch.id}</td>
                  <td>
                    <span
                      className={`badge ${
                        batch.isArchived ? "archived" : "active"
                      }`}
                    >
                      {batch.isArchived ? "ARCHIVED" : "ACTIVE"}
                    </span>
                  </td>
                  <td>{batch.schoolYear?.name ?? "-"}</td>
                  <td>{batch.createdByUser?.name ?? batch.createdByUser?.email ?? "-"}</td>
                  <td>{formatManilaDateTime(batch.createdAt)}</td>
                  <td>{batch._count.students}</td>
                  <td>{batch.createdStudents}</td>
                  <td>{batch.updatedStudents}</td>
                  <td>{batch.skipped}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </body>
    </html>
  );
}