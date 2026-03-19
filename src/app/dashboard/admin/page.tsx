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

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasRole(session.user.role, [ROLES.SUPER_ADMIN, ROLES.ADMIN])) {
    redirect("/unauthorized");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Manage users, students, attendance records, and audit logs.
        </p>
      </div>

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
            <CardTitle className="text-xl">Full Admin Access</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin Overview</CardTitle>
          <CardDescription>
            Use the sidebar to manage users, students, and system activity.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This area is intended for administrators who manage records, review
          audit logs, and maintain the system.
        </CardContent>
      </Card>
    </div>
  );
}