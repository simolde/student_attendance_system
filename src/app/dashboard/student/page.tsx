import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasRole, ROLES } from "@/lib/rbac";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function StudentDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasRole(session.user.role, [ROLES.STUDENT])) {
    redirect("/unauthorized");
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Student Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Welcome, {session.user.name ?? session.user.email}
        </p>
        <div className="mt-3">
          <Badge variant="secondary">{session.user.role}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Access</CardTitle>
          <CardDescription>
            This area is only for students.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          You can use this page to view your information and future attendance
          features.
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Attendance</CardTitle>
            <CardDescription>
              View your attendance history and summaries.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This feature can be added next.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Profile</CardTitle>
            <CardDescription>
              View your student details and section assignment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This feature can be added next.
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold">Quick Links</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Link href="/dashboard">
            <Card className="transition hover:shadow-md">
              <CardHeader>
                <CardTitle>Main Dashboard</CardTitle>
                <CardDescription>
                  Return to the main dashboard.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/login">
            <Card className="transition hover:shadow-md">
              <CardHeader>
                <CardTitle>Login Page</CardTitle>
                <CardDescription>
                  Go back to the login page.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}