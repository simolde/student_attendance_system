import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";

export async function GET(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (
    !hasRole(session.user.role, [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.TEACHER,
      ROLES.STAFF,
    ])
  ) {
    return new Response("Forbidden", { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const sectionId = searchParams.get("sectionId");
  const date = searchParams.get("date");

  if (!sectionId || !date) {
    return new Response("Missing sectionId or date", { status: 400 });
  }

  const records = await prisma.attendance.findMany({
    where: {
      date: new Date(date),
      student: {
        sectionId,
      },
    },
    include: {
      student: {
        include: {
          user: true,
          section: true,
        },
      },
    },
    orderBy: {
      student: {
        studentNo: "asc",
      },
    },
  });

  const headers = [
    "Student No",
    "Name",
    "Email",
    "Section",
    "Date",
    "Status",
    "Remarks",
  ];

  const rows = records.map((record) => [
    record.student.studentNo,
    record.student.user.name ?? "",
    record.student.user.email,
    record.student.section?.name ?? "",
    new Date(record.date).toISOString().slice(0, 10),
    record.status,
    record.remarks ?? "",
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      row
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(",")
    ),
  ].join("\n");

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="attendance-${date}.csv"`,
    },
  });
}