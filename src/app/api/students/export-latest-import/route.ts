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

  const latestStudent = await prisma.student.findFirst({
    where: {
      importBatchId: {
        not: null,
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      importBatchId: true,
    },
  });

  if (!latestStudent?.importBatchId) {
    return new NextResponse("No import batch found", { status: 404 });
  }

  const students = await prisma.student.findMany({
    where: {
      importBatchId: latestStudent.importBatchId,
    },
    include: {
      user: true,
      section: true,
    },
    orderBy: {
      studentNo: "asc",
    },
  });

  const header = [
    "student_no",
    "full_name",
    "email",
    "section",
    "grade_level",
    "temporary_password",
    "login_note",
    "import_batch_id",
  ];

  const rows = students.map((student) => [
    student.studentNo,
    student.user.name ?? "",
    student.user.email,
    student.section?.name ?? "",
    formatGradeLevel(student.section?.gradeLevel),
    "Student@123",
    "Change password on first login",
    latestStudent.importBatchId!,
  ]);

  const csv = [
    header.map(csvEscape).join(","),
    ...rows.map((row) => row.map((cell) => csvEscape(String(cell))).join(",")),
  ].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="student_credentials_latest_import.csv"`,
    },
  });
}