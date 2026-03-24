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

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (!hasRole(session.user.role, [ROLES.SUPER_ADMIN, ROLES.ADMIN])) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const latestBatch = await prisma.studentImportBatch.findFirst({
    where: {
      isArchived: false,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      schoolYear: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!latestBatch) {
    return new NextResponse("No active import batch found", { status: 404 });
  }

  const students = await prisma.student.findMany({
    where: {
      importBatchId: latestBatch.id,
    },
    include: {
      user: true,
      section: true,
    },
    orderBy: {
      studentNo: "asc",
    },
  });

  if (students.length === 0) {
    return new NextResponse("No students found for the latest import batch", {
      status: 404,
    });
  }

  const header = [
    "student_no",
    "full_name",
    "email",
    "section",
    "grade_level",
    "temporary_password",
    "login_note",
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
    "Starland@123",
    "Change password on first login",
    latestBatch.id,
    "ACTIVE",
    latestBatch.schoolYear?.name ?? "",
  ]);

  const csv = [
    header.map(csvEscape).join(","),
    ...rows.map((row) => row.map((cell) => csvEscape(String(cell))).join(",")),
  ].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="student_credentials_latest_import.csv"',
    },
  });
}