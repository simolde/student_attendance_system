import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/logout-button";
import { getDashboardStats } from "@/lib/dashboard";
import DashboardCharts from "@/components/dashboard-charts";
import { hasRole, ROLES } from "@/lib/rbac";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const stats = await getDashboardStats();
  const role = session.user.role;

  const canAccessAdmin = hasRole(role, [ROLES.SUPER_ADMIN, ROLES.ADMIN]);
  const canAccessTeacher = hasRole(role, [
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.TEACHER,
    ROLES.STAFF,
  ]);
  const canAccessStudent = hasRole(role, [ROLES.STUDENT]);

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Welcome, {session.user.name ?? session.user.email}
          </p>
          <p className="text-sm text-muted-foreground">
            Role: {session.user.role}
          </p>
        </div>

        <LogoutButton />
      </div>

      <Separator />

      {!canAccessStudent && (
        <>
          <div>
            <h2 className="text-xl font-semibold">System Overview</h2>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardDescription>Total Users</CardDescription>
                  <CardTitle className="text-3xl">{stats.totalUsers}</CardTitle>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardDescription>Total Students</CardDescription>
                  <CardTitle className="text-3xl">{stats.totalStudents}</CardTitle>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardDescription>Total Sections</CardDescription>
                  <CardTitle className="text-3xl">{stats.totalSections}</CardTitle>
                </CardHeader>
              </Card>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold">
              Attendance Today ({stats.today})
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader>
                  <CardDescription>Present</CardDescription>
                  <CardTitle className="text-2xl">{stats.presentToday}</CardTitle>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardDescription>Late</CardDescription>
                  <CardTitle className="text-2xl">{stats.lateToday}</CardTitle>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardDescription>Absent</CardDescription>
                  <CardTitle className="text-2xl">{stats.absentToday}</CardTitle>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardDescription>Excused</CardDescription>
                  <CardTitle className="text-2xl">{stats.excusedToday}</CardTitle>
                </CardHeader>
              </Card>
            </div>
          </div>

          <DashboardCharts
            attendanceStatusData={stats.attendanceStatusData}
            sectionAttendanceData={stats.sectionAttendanceData}
          />
        </>
      )}

      <div>
        <h2 className="text-xl font-semibold">Quick Links</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/dashboard/account">
            <Card className="transition hover:shadow-md">
              <CardHeader>
                <CardTitle>My Account</CardTitle>
                <CardDescription>
                  Update your profile information.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/change-password">
            <Card className="transition hover:shadow-md">
              <CardHeader>
                <CardTitle>Change My Password</CardTitle>
                <CardDescription>
                  Update your own password securely.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          {canAccessAdmin && (
            <Link href="/dashboard/admin">
              <Card className="transition hover:shadow-md">
                <CardHeader>
                  <CardTitle>Admin Dashboard</CardTitle>
                  <CardDescription>
                    Manage users, students, and audit logs.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )}

          {canAccessTeacher && (
            <Link href="/dashboard/teacher">
              <Card className="transition hover:shadow-md">
                <CardHeader>
                  <CardTitle>Teacher Dashboard</CardTitle>
                  <CardDescription>
                    Record attendance and review attendance history.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )}

          {canAccessStudent && (
            <Link href="/dashboard/student">
              <Card className="transition hover:shadow-md">
                <CardHeader>
                  <CardTitle>Student Dashboard</CardTitle>
                  <CardDescription>
                    View your attendance and profile.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}