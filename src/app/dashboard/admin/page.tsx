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

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasRole(session.user.role, [ROLES.SUPER_ADMIN, ROLES.ADMIN])) {
    redirect("/unauthorized");
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Welcome, {session.user.name ?? session.user.email}
        </p>
        <div className="mt-3">
          <Badge variant="secondary">{session.user.role}</Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/admin/students">
          <Card className="h-full transition hover:shadow-md">
            <CardHeader>
              <CardTitle>Student Management</CardTitle>
              <CardDescription>
                Create sections, add students, and manage student records.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/dashboard/admin/users">
          <Card className="h-full transition hover:shadow-md">
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Create admin, teacher, staff, and student accounts.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/dashboard/admin/audit-logs">
          <Card className="h-full transition hover:shadow-md">
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>
                Review security and system activity records.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin Access</CardTitle>
          <CardDescription>
            Only ADMIN and SUPER_ADMIN roles can access this area.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Use the links above to manage the system safely.
        </CardContent>
      </Card>
    </div>
  );
}