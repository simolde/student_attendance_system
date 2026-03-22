import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import TableToolbar from "@/components/layout/table-toolbar";
import StudentRfidTable from "./rfid-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const PAGE_SIZE = 15;

export default async function StudentRfidPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; unassigned?: string; page?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasRole(session.user.role, [ROLES.SUPER_ADMIN, ROLES.ADMIN])) {
    redirect("/unauthorized");
  }

  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const unassigned = params.unassigned === "1";
  const page = Math.max(Number(params.page || "1"), 1);

  const activeSchoolYear = await prisma.schoolYear.findFirst({
    where: { isActive: true },
    select: { id: true, name: true },
  });

  if (!activeSchoolYear) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Student RFID Assignment"
          description="Assign RFID cards to enrolled students."
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Admin", href: "/dashboard/admin" },
            { label: "Student RFID" },
          ]}
        />

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-8 text-center text-sm text-slate-500">
            No active school year found. Create and activate a school year first.
          </CardContent>
        </Card>
      </div>
    );
  }

  const where = {
    schoolYearId: activeSchoolYear.id,
    status: "ENROLLED" as const,
    student: {
      ...(unassigned ? { rfidUid: null } : {}),
      ...(q
        ? {
            OR: [
              { studentNo: { contains: q, mode: "insensitive" as const } },
              { rfidUid: { contains: q, mode: "insensitive" as const } },
              { user: { name: { contains: q, mode: "insensitive" as const } } },
              { user: { email: { contains: q, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    },
  };

  const [enrollments, totalRows] = await Promise.all([
    prisma.enrollment.findMany({
      where,
      include: {
        section: true,
        student: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        student: {
          studentNo: "asc",
        },
      },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.enrollment.count({ where }),
  ]);

  const totalPages = Math.max(Math.ceil(totalRows / PAGE_SIZE), 1);

  function buildUrl(nextPage: number) {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (unassigned) sp.set("unassigned", "1");
    sp.set("page", String(nextPage));
    return `/dashboard/admin/students/rfid?${sp.toString()}`;
  }

  const students = enrollments.map((enrollment) => ({
    id: enrollment.student.id,
    studentNo: enrollment.student.studentNo,
    rfidUid: enrollment.student.rfidUid,
    sectionName: enrollment.section.name,
    user: {
      name: enrollment.student.user.name,
      email: enrollment.student.user.email,
    },
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Student RFID Assignment"
        description={`Assign or update RFID cards for enrolled students in ${activeSchoolYear.name}.`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin", href: "/dashboard/admin" },
          { label: "Student RFID" },
        ]}
      />

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle>RFID Assignment</CardTitle>
          <CardDescription>
            Page {page} of {totalPages} • {totalRows} enrolled students
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <TableToolbar>
            <form method="GET" className="grid flex-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium">Search</label>
                <Input
                  name="q"
                  defaultValue={q}
                  placeholder="Student no, RFID, name, or email"
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    name="unassigned"
                    value="1"
                    defaultChecked={unassigned}
                  />
                  Show only students without RFID
                </label>
              </div>

              <input type="hidden" name="page" value="1" />

              <div className="flex items-end gap-2">
                <Button type="submit">Apply</Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/dashboard/admin/students/rfid">Reset</Link>
                </Button>
              </div>
            </form>
          </TableToolbar>

          {students.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              No students found.
            </div>
          ) : (
            <>
              <StudentRfidTable students={students} />

              <div className="flex items-center justify-between">
                <Button variant="outline" asChild disabled={page <= 1}>
                  <Link href={buildUrl(page - 1)}>Previous</Link>
                </Button>

                <span className="text-sm text-slate-500">
                  Page {page} of {totalPages}
                </span>

                <Button variant="outline" asChild disabled={page >= totalPages}>
                  <Link href={buildUrl(page + 1)}>Next</Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}