import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasRole, ROLES } from "@/lib/rbac";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/layout/page-header";

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
    <div className="space-y-8">
      <PageHeader
        title="Teacher Dashboard"
        description="Record attendance and review attendance history."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Teacher" },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Logged in as</CardDescription>
            <CardTitle className="text-xl">
              {session.user.name ?? session.user.email}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Role</CardDescription>
            <CardTitle>
              <Badge variant="secondary">{session.user.role}</Badge>
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Access</CardDescription>
            <CardTitle className="text-xl">Attendance Tools</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Teacher Overview</CardTitle>
          <CardDescription>
            Use the sidebar to record attendance and review saved records.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This area is for teachers and staff who manage daily attendance and
          attendance history.
        </CardContent>
      </Card>
    </div>
  );
}