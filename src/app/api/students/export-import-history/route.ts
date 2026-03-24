import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { NextResponse } from "next/server";

function csvEscape(value: string) {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
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

export async function GET(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (!hasRole(session.user.role, [ROLES.SUPER_ADMIN, ROLES.ADMIN])) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const showArchived = searchParams.get("archived") === "1";
  const q = searchParams.get("q")?.trim() ?? "";

  const where = {
    ...(showArchived ? {} : { isArchived: false }),
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

  const batches = await prisma.studentImportBatch.findMany({
    where,
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
  });

  const header = [
    "batch_id",
    "status",
    "school_year",
    "imported_by",
    "imported_by_email",
    "imported_at",
    "student_count",
    "total_rows",
    "created_users",
    "created_students",
    "created_enrollments",
    "updated_users",
    "updated_students",
    "updated_enrollments",
    "skipped",
  ];

  const rows = batches.map((batch) => [
    batch.id,
    batch.isArchived ? "ARCHIVED" : "ACTIVE",
    batch.schoolYear?.name ?? "",
    batch.createdByUser?.name ?? "",
    batch.createdByUser?.email ?? "",
    formatManilaDateTime(batch.createdAt),
    String(batch._count.students),
    String(batch.totalRows),
    String(batch.createdUsers),
    String(batch.createdStudents),
    String(batch.createdEnrollments),
    String(batch.updatedUsers),
    String(batch.updatedStudents),
    String(batch.updatedEnrollments),
    String(batch.skipped),
  ]);

  const csv = [
    header.map(csvEscape).join(","),
    ...rows.map((row) => row.map((cell) => csvEscape(cell)).join(",")),
  ].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="student_import_history.csv"',
    },
  });
}