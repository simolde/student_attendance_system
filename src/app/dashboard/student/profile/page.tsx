import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function StudentProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasRole(session.user.role, [ROLES.STUDENT])) {
    redirect("/unauthorized");
  }

  const student = await prisma.student.findUnique({
    where: {
      userId: session.user.id,
    },
    include: {
      user: true,
      section: true,
    },
  });

  if (!student) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Student Profile Not Found</CardTitle>
            <CardDescription>
              Your account does not have a linked student profile yet.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="mt-2 text-muted-foreground">
          View your student account details.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription>Full Name</CardDescription>
            <CardTitle>{student.user.name ?? "-"}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Email</CardDescription>
            <CardTitle className="text-lg">{student.user.email}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Student Number</CardDescription>
            <CardTitle>{student.studentNo}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Section</CardDescription>
            <CardTitle>{student.section?.name ?? "-"}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Your current account role and status.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center">
          <div>
            <p className="mb-2 text-sm text-muted-foreground">Role</p>
            <Badge variant="secondary">{student.user.role}</Badge>
          </div>

          <div>
            <p className="mb-2 text-sm text-muted-foreground">Status</p>
            {student.user.isActive ? (
              <Badge>Active</Badge>
            ) : (
              <Badge variant="destructive">Inactive</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/student"
          className="inline-block rounded-md border px-4 py-2 text-sm hover:bg-accent"
        >
          Back to Student Dashboard
        </Link>

        <Link
          href="/dashboard/student/attendance"
          className="inline-block rounded-md border px-4 py-2 text-sm hover:bg-accent"
        >
          Go to My Attendance
        </Link>
      </div>
    </div>
  );
}