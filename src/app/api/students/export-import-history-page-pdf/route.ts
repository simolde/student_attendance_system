import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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
  const dateFrom = searchParams.get("dateFrom")?.trim() ?? "";
  const dateTo = searchParams.get("dateTo")?.trim() ?? "";
  const schoolYearId = searchParams.get("schoolYearId")?.trim() ?? "";
  const sectionId = searchParams.get("sectionId")?.trim() ?? "";
  const createdByUserId = searchParams.get("createdByUserId")?.trim() ?? "";
  const page = Math.max(Number(searchParams.get("page") || "1"), 1);

  const createdAtRange = buildDateRange(dateFrom, dateTo);

  const where = {
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
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  if (batches.length === 0) {
    return new NextResponse("No import history found for this page", {
      status: 404,
    });
  }

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  doc.setFontSize(16);
  doc.text("Student Import History - Current Page", 14, 14);

  doc.setFontSize(10);
  doc.text(`Page: ${page}`, 14, 21);
  doc.text(
    `View: ${showArchived ? "Active + Archived" : "Active Only"}`,
    14,
    27
  );

  let filterY = 33;
  if (q) {
    doc.text(`Search: ${q}`, 14, filterY);
    filterY += 6;
  }
  if (dateFrom || dateTo) {
    doc.text(`Date Range: ${dateFrom || "Any"} -> ${dateTo || "Any"}`, 14, filterY);
    filterY += 6;
  }

  autoTable(doc, {
    startY: filterY + 2,
    head: [[
      "Batch ID",
      "Status",
      "School Year",
      "Imported By",
      "Imported At",
      "Students",
      "Created",
      "Updated",
      "Skipped",
    ]],
    body: batches.map((batch) => [
      batch.id,
      batch.isArchived ? "ARCHIVED" : "ACTIVE",
      batch.schoolYear?.name ?? "-",
      batch.createdByUser?.name ?? batch.createdByUser?.email ?? "-",
      formatManilaDateTime(batch.createdAt),
      String(batch._count.students),
      String(batch.createdStudents),
      String(batch.updatedStudents),
      String(batch.skipped),
    ]),
    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [37, 99, 235],
    },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 20 },
      2: { cellWidth: 28 },
      3: { cellWidth: 38 },
      4: { cellWidth: 32 },
      5: { cellWidth: 18 },
      6: { cellWidth: 18 },
      7: { cellWidth: 18 },
      8: { cellWidth: 18 },
    },
    margin: { left: 10, right: 10 },
  });

  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="student_import_history_page_${page}.pdf"`,
    },
  });
}