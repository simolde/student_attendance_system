import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { buildStudentsWhere } from "@/lib/student-filters";

const PAGE_SIZE = 10;

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
  const q = searchParams.get("q")?.trim() ?? "";
  const sectionId = searchParams.get("sectionId")?.trim() ?? "";
  const importBatchId = searchParams.get("importBatchId")?.trim() ?? "";
  const rfidStatus = searchParams.get("rfidStatus")?.trim() ?? "";
  const page = Math.max(Number(searchParams.get("page") || "1"), 1);

  const batch = importBatchId
    ? await prisma.studentImportBatch.findUnique({
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
    : null;

  const where = buildStudentsWhere({
    q,
    sectionId,
    importBatchId,
    rfidStatus,
  });

  const students = await prisma.student.findMany({
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
  doc.text("Students Directory - Current Page", 14, 14);

  doc.setFontSize(10);
  doc.text(`Page: ${page}`, 14, 21);

  let metaY = 27;

  if (importBatchId) {
    doc.text(`Batch: ${importBatchId}`, 14, metaY);
    metaY += 6;
  }

  if (q) {
    doc.text(`Search: ${q}`, 14, metaY);
    metaY += 6;
  }

  if (sectionId) {
    doc.text(`Section Filter ID: ${sectionId}`, 14, metaY);
    metaY += 6;
  }

  if (rfidStatus) {
    doc.text(`RFID Status: ${rfidStatus}`, 14, metaY);
    metaY += 6;
  }

  if (batch) {
    doc.text(
      `Batch Status: ${batch.isArchived ? "ARCHIVED" : "ACTIVE"} | School Year: ${batch.schoolYear?.name ?? "-"}`,
      14,
      metaY
    );
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
      "Content-Disposition": `attachment; filename="students_view_page_${page}.pdf"`,
    },
  });
}