import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { NextResponse } from "next/server";

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
  const q = searchParams.get("q")?.trim() ?? "";
  const sectionId = searchParams.get("sectionId")?.trim() ?? "";
  const importBatchId = searchParams.get("importBatchId")?.trim() ?? "";
  const rfidStatus = searchParams.get("rfidStatus")?.trim() ?? "";

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

  const rfidCondition =
    rfidStatus === "WITH_RFID"
      ? { NOT: { rfidUid: null as string | null } }
      : rfidStatus === "WITHOUT_RFID"
      ? { rfidUid: null as string | null }
      : {};

  const where = {
    AND: [
      sectionId ? { sectionId } : {},
      importBatchId ? { importBatchId } : {},
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
  });

  if (students.length === 0) {
    return new NextResponse("No students found for this view", {
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
    "import_batch_id",
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
    importBatchId || "",
    batch ? (batch.isArchived ? "ARCHIVED" : "ACTIVE") : "",
    batch?.schoolYear?.name ?? "",
  ]);

  const csv = [
    header.map(csvEscape).join(","),
    ...rows.map((row) => row.map((cell) => csvEscape(String(cell))).join(",")),
  ].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
  
      "Content-Disposition": 'attachment; filename="students_view_export.csv"',
    },
  });
}