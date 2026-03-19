import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect } from "next/navigation";
import Link from "next/link";
import StudentManagementForms from "./forms";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/layout/page-header";

const PAGE_SIZE = 10;

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sectionId?: string; page?: string }>;
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
  const sectionId = params.sectionId?.trim() ?? "";
  const page = Math.max(Number(params.page || "1"), 1);

  const sections = await prisma.section.findMany({
    orderBy: { name: "asc" },
  });

  const where = {
    AND: [
      sectionId ? { sectionId } : {},
      q
        ? {
            OR: [
              { studentNo: { contains: q, mode: "insensitive" as const } },
              { user: { name: { contains: q, mode: "insensitive" as const } } },
              { user: { email: { contains: q, mode: "insensitive" as const } } },
            ],
          }
        : {},
    ],
  };

  const [students, totalStudents] = await Promise.all([
    prisma.student.findMany({
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
    }),
    prisma.student.count({ where }),
  ]);

  const totalPages = Math.max(Math.ceil(totalStudents / PAGE_SIZE), 1);

  function buildUrl(nextPage: number) {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (sectionId) sp.set("sectionId", sectionId);
    sp.set("page", String(nextPage));
    return `/dashboard/admin/students?${sp.toString()}`;
  }

  return (
    <div className="p-6 space-y-8">
      <PageHeader
        title="Student Management"
        description="Create sections and add students to those sections."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin", href: "/dashboard/admin" },
          { label: "Student Management" },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Manage Students and Sections</CardTitle>
          <CardDescription>
            Create sections and add students to those sections.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StudentManagementForms sections={sections} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Search and Filter</CardTitle>
          <CardDescription>
            Search students by name, email, or student number.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form method="GET" className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Search</label>
              <Input
                name="q"
                defaultValue={q}
                placeholder="Name, email, or student number"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Section</label>
              <select
                name="sectionId"
                defaultValue={sectionId}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">All sections</option>
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </select>
            </div>

            <input type="hidden" name="page" value="1" />

            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
              >
                Apply
              </button>

              <a
                href="/dashboard/admin/students"
                className="rounded-md border px-4 py-2 text-sm"
              >
                Reset
              </a>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sections</CardTitle>
        </CardHeader>
        <CardContent>
          {sections.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sections yet.</p>
          ) : (
            <ul className="space-y-2">
              {sections.map((section) => (
                <li key={section.id} className="rounded-md border px-3 py-2">
                  {section.name}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
          <CardDescription>
            Page {page} of {totalPages} • {totalStudents} total students
          </CardDescription>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students found.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student No</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Section</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.studentNo}</TableCell>
                      <TableCell>{student.user.name}</TableCell>
                      <TableCell>{student.user.email}</TableCell>
                      <TableCell>{student.section?.name ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 flex items-center justify-between">
                <Link
                  href={buildUrl(page - 1)}
                  className={`rounded-md border px-4 py-2 text-sm ${
                    page <= 1 ? "pointer-events-none opacity-50" : ""
                  }`}
                >
                  Previous
                </Link>

                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>

                <Link
                  href={buildUrl(page + 1)}
                  className={`rounded-md border px-4 py-2 text-sm ${
                    page >= totalPages ? "pointer-events-none opacity-50" : ""
                  }`}
                >
                  Next
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}