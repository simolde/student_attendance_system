import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect } from "next/navigation";
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

export default async function AdminStudentsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasRole(session.user.role, [ROLES.SUPER_ADMIN, ROLES.ADMIN])) {
    redirect("/unauthorized");
  }

  const sections = await prisma.section.findMany({
    orderBy: { name: "asc" },
  });

  const students = await prisma.student.findMany({
    include: {
      user: true,
      section: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Student Management</h1>
        <p className="mt-2 text-muted-foreground">
          Only ADMIN and SUPER_ADMIN can access this page.
        </p>
      </div>

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
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students yet.</p>
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}