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

  const pageBatchCount = batches.length;
  const pageStudentCount = batches.reduce(
    (sum, batch) => sum + batch._count.students,
    0,
  );
  const pageCreatedStudents = batches.reduce(
    (sum, batch) => sum + batch.createdStudents,
    0,
  );
  const pageUpdatedStudents = batches.reduce(
    (sum, batch) => sum + batch.updatedStudents,
    0,
  );

  return (
    <PrintPage>
      <PrintTitle
        title="Student Import History"
        meta={
          <>
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
          </>
        }
      />

      {q || dateFrom || dateTo || schoolYearId || sectionId || createdByUserId ? (
        <PrintFilters>
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
        </PrintFilters>
      ) : null}

      <PrintSummaryGrid columns={4}>
        <PrintSummaryCard label="Batches on This Page" value={pageBatchCount} />
        <PrintSummaryCard
          label="Students on This Page"
          value={pageStudentCount}
        />
        <PrintSummaryCard
          label="Created Students"
          value={pageCreatedStudents}
        />
        <PrintSummaryCard
          label="Updated Students"
          value={pageUpdatedStudents}
        />
      </PrintSummaryGrid>

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
                <td>
                  {batch.createdByUser?.name ??
                    batch.createdByUser?.email ??
                    "-"}
                </td>
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
    </PrintPage>
  );
}