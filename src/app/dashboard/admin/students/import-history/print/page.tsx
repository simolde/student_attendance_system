import { auth } from "@/auth";
import PrintPage from "@/components/print/print-page";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect } from "next/navigation";

const PAGE_SIZE = 10;

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(value);
}

export default async function PrintStudentImportHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    schoolYearId?: string;
    createdByUserId?: string;
    archived?: string;
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
  const schoolYearId = params.schoolYearId?.trim() ?? "";
  const createdByUserId = params.createdByUserId?.trim() ?? "";
  const archived = params.archived?.trim() ?? "";
  const page = Math.max(Number(params.page || "1"), 1);

  const archivedFilter =
    archived === "archived"
      ? true
      : archived === "active"
        ? false
        : undefined;

  const [schoolYears, users] = await Promise.all([
    prisma.schoolYear.findMany({
      orderBy: { name: "desc" },
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.user.findMany({
      where: {
        role: {
          in: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
        },
      },
      orderBy: [{ name: "asc" }, { email: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
      },
    }),
  ]);

  const where = {
    AND: [
      schoolYearId ? { schoolYearId } : {},
      createdByUserId ? { createdByUserId } : {},
      typeof archivedFilter === "boolean"
        ? { isArchived: archivedFilter }
        : {},
      q
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
        : {},
    ],
  };

  const [batches, totalBatches, summaryRows] = await Promise.all([
    prisma.studentImportBatch.findMany({
      where,
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
    prisma.studentImportBatch.count({ where }),
    prisma.studentImportBatch.findMany({
      where,
      select: {
        id: true,
        isArchived: true,
      },
    }),
  ]);

  const totalPages = Math.max(Math.ceil(totalBatches / PAGE_SIZE), 1);
  const activeCount = summaryRows.filter((batch) => !batch.isArchived).length;
  const archivedCount = summaryRows.filter((batch) => batch.isArchived).length;

  const schoolYearName =
    schoolYears.find((item) => item.id === schoolYearId)?.name ?? schoolYearId;

  const createdByName =
    users.find((item) => item.id === createdByUserId)?.name ??
    users.find((item) => item.id === createdByUserId)?.email ??
    createdByUserId;

  const filterSummary = [
    q ? `Search: ${q}` : null,
    schoolYearId ? `School Year: ${schoolYearName}` : null,
    createdByUserId ? `Created By: ${createdByName}` : null,
    archived
      ? `Status: ${
          archived === "archived"
            ? "Archived"
            : archived === "active"
              ? "Active"
              : archived
        }`
      : null,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <PrintPage
      title="Student Import History"
      subtitle={
        [
          `Page ${page} of ${totalPages}`,
          `Total Batches: ${totalBatches}`,
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
            <div className="text-sm text-muted-foreground">Batches on This Page</div>
            <div className="mt-1 text-2xl font-semibold">{batches.length}</div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Active Batches</div>
            <div className="mt-1 text-2xl font-semibold">{activeCount}</div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Archived Batches</div>
            <div className="mt-1 text-2xl font-semibold">{archivedCount}</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-3 py-2 text-left font-semibold">Batch ID</th>
                <th className="px-3 py-2 text-left font-semibold">School Year</th>
                <th className="px-3 py-2 text-left font-semibold">Created By</th>
                <th className="px-3 py-2 text-left font-semibold">Created At</th>
                <th className="px-3 py-2 text-left font-semibold">Rows</th>
                <th className="px-3 py-2 text-left font-semibold">Students</th>
                <th className="px-3 py-2 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                    No import batches found.
                  </td>
                </tr>
              ) : (
                batches.map((batch) => (
                  <tr key={batch.id} className="border-b">
                    <td className="px-3 py-2">{batch.id}</td>
                    <td className="px-3 py-2">{batch.schoolYear?.name ?? "-"}</td>
                    <td className="px-3 py-2">
                      {batch.createdByUser?.name ??
                        batch.createdByUser?.email ??
                        "-"}
                    </td>
                    <td className="px-3 py-2">{formatDate(batch.createdAt)}</td>
                    <td className="px-3 py-2">{batch.totalRows}</td>
                    <td className="px-3 py-2">{batch._count.students}</td>
                    <td className="px-3 py-2">
                      {batch.isArchived ? "ARCHIVED" : "ACTIVE"}
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