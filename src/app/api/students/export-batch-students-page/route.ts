import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { buildBatchStudentsWhere } from "@/lib/student-filters";
import { NextResponse } from "next/server";

const PAGE_SIZE = 20;

function csvEscape(value: string) {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
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

  const where = buildBatchStudentsWhere({
    batchId,
    q,
    sectionId,
    rfidStatus,
  });

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

  const header = [
    "student_no",
    "full_name",
    "email",
    "section",
    "grade_level",
    "rfid_uid",
    "rfid_status",
    "batch_id",
    "batch_status",
    "school_year",
  ];

  const rows = students.map((student) => [
    student.studentNo,
    student.user.name ?? "",
    student.user.email,
    student.section?.name ?? "",
    formatGradeLevel(student.section?.gradeLevel),
    student.rfidUid ?? "",
    student.rfidUid ? "WITH_RFID" : "WITHOUT_RFID",
    batch.id,
    batch.isArchived ? "ARCHIVED" : "ACTIVE",
    batch.schoolYear?.name ?? "",
  ]);

  const csv = [
    header.map(csvEscape).join(","),
    ...rows.map((row) => row.map((cell) => csvEscape(String(cell))).join(",")),
  ].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="batch_students_page_${page}.csv"`,
    },
  });
}