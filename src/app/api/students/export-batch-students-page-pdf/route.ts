import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const PAGE_SIZE = 20;

function formatGradeLevel(value: string | null | undefined) {
  if (!value) return "-";
  return value.replace(/_/g, " ");
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
  const batchId = searchParams.get("batchId")?.trim();
  const q = searchParams.get("q")?.trim() ?? "";
  const rfidStatus = searchParams.get("rfidStatus")?.trim() ?? "";
  const sectionId = searchParams.get("sectionId")?.trim() ?? "";
  const page = Math.max(Number(searchParams.get("page") || "1"), 1);

  if (!batchId) {
    return new NextResponse("Missing batchId", { status: 400 });
  }

  const batch = await prisma.studentImportBatch.findUnique({
    where: { id: batchId },
    select: {
      id: true,
      isArchived: true,
      schoolYear: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!batch) {
    return new NextResponse("Import batch not found", { status: 404 });
  }

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

  const students = await prisma.student.findMany({
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
  });

  if (students.length === 0) {
    return new NextResponse("No students found for this page", {
      status: 404,
    });
  }

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  doc.setFontSize(16);
  doc.text("Batch Students - Current Page", 14, 14);

  doc.setFontSize(10);
  doc.text(`Batch ID: ${batch.id}`, 14, 21);
  doc.text(`Page: ${page}`, 14, 27);
  doc.text(
    `Batch Status: ${batch.isArchived ? "ARCHIVED" : "ACTIVE"} | School Year: ${batch.schoolYear?.name ?? "-"}`,
    14,
    33
  );

  let metaY = 39;

  if (q) {
    doc.text(`Search: ${q}`, 14, metaY);
    metaY += 6;
  }

  if (rfidStatus) {
    doc.text(`RFID Status: ${rfidStatus}`, 14, metaY);
    metaY += 6;
  }

  if (sectionId) {
    doc.text(`Section Filter ID: ${sectionId}`, 14, metaY);
    metaY += 6;
  }

  autoTable(doc, {
    startY: metaY + 2,
    head: [[
      "Student No",
      "Name",
      "Email",
      "Section",
      "Grade Level",
      "RFID UID",
      "RFID Status",
    ]],
    body: students.map((student) => [
      student.studentNo,
      student.user.name ?? "-",
      student.user.email,
      student.section?.name ?? "-",
      formatGradeLevel(student.section?.gradeLevel),
      student.rfidUid ?? "-",
      student.rfidUid ? "WITH_RFID" : "WITHOUT_RFID",
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
      0: { cellWidth: 26 },
      1: { cellWidth: 38 },
      2: { cellWidth: 52 },
      3: { cellWidth: 30 },
      4: { cellWidth: 28 },
      5: { cellWidth: 42 },
      6: { cellWidth: 24 },
    },
    margin: { left: 10, right: 10 },
  });

  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="batch_students_page_${page}.pdf"`,
    },
  });
}