import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect } from "next/navigation";
import Link from "next/link";
import StudentManagementForms from "./forms";
import PageHeader from "@/components/layout/page-header";
import TableToolbar from "@/components/layout/table-toolbar";
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
import { Button } from "@/components/ui/button";

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
    <div className="space-y-8">
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
          <CardTitle>Sections</CardTitle>
          <CardDescription>Available class/section list.</CardDescription>
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

        <CardContent className="space-y-6">
          <TableToolbar>
            <form method="GET" className="grid flex-1 gap-4 md:grid-cols-3">
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
                <Button type="submit">Apply</Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/dashboard/admin/students">Reset</Link>
                </Button>
              </div>
            </form>
          </TableToolbar>

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
                      <TableCell>{student.user.name ?? "-"}</TableCell>
                      <TableCell>{student.user.email}</TableCell>
                      <TableCell>{student.section?.name ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between">
                <Button variant="outline" asChild disabled={page <= 1}>
                  <Link href={buildUrl(page - 1)}>Previous</Link>
                </Button>

                <span className="text-sm text-muted-foreground">
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