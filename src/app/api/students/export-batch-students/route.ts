import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { NextResponse } from "next/server";

const PAGE_SIZE = 20;

function escapeCsv(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function formatManilaDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasRole(session.user.role, [ROLES.SUPER_ADMIN, ROLES.ADMIN])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);

  const batchId = searchParams.get("batchId")?.trim() ?? "";
  const scope = searchParams.get("scope") === "page" ? "page" : "filtered";
  const q = searchParams.get("q")?.trim() ?? "";
  const sectionId = searchParams.get("sectionId")?.trim() ?? "all";
  const rfidStatus = searchParams.get("rfidStatus")?.trim() ?? "all";
  const page = Math.max(Number(searchParams.get("page") || "1"), 1);

  if (!batchId) {
    return NextResponse.json({ error: "Missing batchId" }, { status: 400 });
  }

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
    },
  });

  if (!batch) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }

  const where = {
    importBatchId: batchId,
    ...(sectionId !== "all" ? { sectionId } : {}),
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
              user: {
                name: { contains: q, mode: "insensitive" as const },
              },
            },
            {
              user: {
                email: { contains: q, mode: "insensitive" as const },
              },
            },
            {
              section: {
                name: { contains: q, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {}),
  };

  const students = await prisma.student.findMany({
    where,
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      section: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [{ studentNo: "asc" }, { createdAt: "asc" }],
    ...(scope === "page"
      ? {
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        }
      : {}),
  });

  const rows = [
    [
      "Batch ID",
      "Batch Status",
      "School Year",
      "Imported By",
      "Imported At",
      "Student ID",
      "Student No",
      "User Name",
      "User Email",
      "Section",
      "RFID UID",
      "Student Created At",
    ],
    ...students.map((student) => [
      batch.id,
      batch.isArchived ? "Archived" : "Active",
      batch.schoolYear?.name ?? "",
      batch.createdByUser?.name ?? batch.createdByUser?.email ?? "",
      formatManilaDateTime(batch.createdAt),
      student.id,
      student.studentNo,
      student.user?.name ?? "",
      student.user?.email ?? "",
      student.section?.name ?? "",
      student.rfidUid ?? "",
      formatManilaDateTime(student.createdAt),
    ]),
  ];

  const csv = rows
    .map((row) => row.map((cell) => escapeCsv(cell)).join(","))
    .join("\n");

  const safeBatchId = batch.id.replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename =
    scope === "page"
      ? `student-import-batch-${safeBatchId}-page-${page}.csv`
      : `student-import-batch-${safeBatchId}-filtered.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}