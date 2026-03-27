import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { buildBatchStudentsWhere } from "@/lib/student-filters";
import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const PAGE_SIZE = 20;

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
      createdAt: true,
      totalRows: true,
      createdStudents: true,
      updatedStudents: true,
      skipped: true,
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
  });

  if (!batch) {
    return new NextResponse("Import batch not found", { status: 404 });
  }

  const where = buildBatchStudentsWhere({
    batchId,
    q,
    sectionId,
    rfidStatus,
  });

  const [students, totalStudents] = await Promise.all([
    prisma.student.findMany({
      where,
      include: {
        user: true,
        section: true,
      },
      orderBy: [{ studentNo: "asc" }, { createdAt: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.student.count({
      where,
    }),
  ]);

  if (students.length === 0) {
    return new NextResponse("No students found for this batch page", {
      status: 404,
    });
  }

  const totalPages = Math.max(Math.ceil(totalStudents / PAGE_SIZE), 1);
  const withRfid = students.filter((student) => !!student.rfidUid?.trim()).length;
  const withoutRfid = students.length - withRfid;

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  doc.setFontSize(16);
  doc.text("Import Batch Details - Current Page", 14, 14);

  doc.setFontSize(10);
  doc.text(`Batch ID: ${batch.id}`, 14, 21);
  doc.text(`Status: ${batch.isArchived ? "ARCHIVED" : "ACTIVE"}`, 14, 27);
  doc.text(`School Year: ${batch.schoolYear?.name ?? "-"}`, 14, 33);
  doc.text(
    `Imported By: ${batch.createdByUser?.name ?? batch.createdByUser?.email ?? "-"}`,
    14,
    39,
  );
  doc.text(`Imported At: ${formatManilaDateTime(batch.createdAt)}`, 14, 45);

  doc.text(`Page: ${page} of ${totalPages}`, 110, 21);
  doc.text(`Total Matching Students: ${totalStudents}`, 110, 27);
  doc.text(`Students on Page: ${students.length}`, 110, 33);
  doc.text(`With RFID: ${withRfid}`, 110, 39);
  doc.text(`Without RFID: ${withoutRfid}`, 110, 45);

  let filterY = 53;

  if (q || sectionId || rfidStatus) {
    doc.setFontSize(10);
    doc.text("Applied Filters:", 14, filterY);
    filterY += 6;

    if (q) {
      doc.text(`Search: ${q}`, 18, filterY);
      filterY += 6;
    }

    if (sectionId) {
      doc.text(`Section ID: ${sectionId}`, 18, filterY);
      filterY += 6;
    }

    if (rfidStatus) {
      doc.text(
        `RFID Status: ${
          rfidStatus === "with-rfid"
            ? "With RFID"
            : rfidStatus === "without-rfid"
              ? "Without RFID"
              : rfidStatus
        }`,
        18,
        filterY,
      );
      filterY += 6;
    }
  }

  autoTable(doc, {
    startY: filterY + 2,
    head: [[
      "#",
      "Student No",
      "Full Name",
      "Email",
      "Section",
      "Grade Level",
      "RFID UID",
      "Created At",
    ]],
    body: students.map((student, index) => [
      String((page - 1) * PAGE_SIZE + index + 1),
      student.studentNo,
      student.user?.name ?? "-",
      student.user?.email ?? "-",
      student.section?.name ?? "-",
      formatGradeLevel(student.section?.gradeLevel),
      student.rfidUid ?? "No RFID",
      formatManilaDateTime(student.createdAt),
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
      0: { cellWidth: 12 },
      1: { cellWidth: 28 },
      2: { cellWidth: 45 },
      3: { cellWidth: 48 },
      4: { cellWidth: 28 },
      5: { cellWidth: 24 },
      6: { cellWidth: 32 },
      7: { cellWidth: 30 },
    },
    margin: { left: 10, right: 10 },
  });

  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 170;

  doc.setFontSize(9);
  doc.text(
    `Batch Students: ${batch._count.students}   |   Total Rows: ${batch.totalRows}   |   Created Students: ${batch.createdStudents}   |   Updated Students: ${batch.updatedStudents}   |   Skipped: ${batch.skipped}`,
    14,
    Math.min(finalY + 10, 190),
  );

  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="batch_students_${batch.id}_page_${page}.pdf"`,
    },
  });
}