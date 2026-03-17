import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasRole, ROLES } from "@/lib/rbac";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function TeacherDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (
    !hasRole(session.user.role, [
      ROLES.TEACHER,
      ROLES.STAFF,
      ROLES.ADMIN,
      ROLES.SUPER_ADMIN,
    ])
  ) {
    redirect("/unauthorized");
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Welcome, {session.user.name ?? session.user.email}
        </p>
        <div className="mt-3">
          <Badge variant="secondary">{session.user.role}</Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/dashboard/teacher/attendance">
          <Card className="h-full transition hover:shadow-md">
            <CardHeader>
              <CardTitle>Attendance Recording</CardTitle>
              <CardDescription>
                Record daily attendance for students by section and date.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/dashboard/teacher/attendance/history">
          <Card className="h-full transition hover:shadow-md">
            <CardHeader>
              <CardTitle>Attendance History</CardTitle>
              <CardDescription>
                Review saved attendance and export reports.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Teacher Access</CardTitle>
          <CardDescription>
            TEACHER, STAFF, ADMIN, and SUPER_ADMIN can access this area.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Use the cards above to record and review attendance.
        </CardContent>
      </Card>
    </div>
  );
}