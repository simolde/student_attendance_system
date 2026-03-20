import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getDashboardStats } from "@/lib/dashboard";
import { hasRole, ROLES } from "@/lib/rbac";
import PageHeader from "@/components/layout/page-header";
import DashboardCharts from "@/components/dashboard-charts";
import StatCard from "@/components/ui/stat-card";
import {
  Users,
  GraduationCap,
  School,
  CheckCircle2,
  Clock3,
  XCircle,
  FileCheck,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const stats = await getDashboardStats();
  const role = session.user.role;

  const canSeeSystemStats = !hasRole(role, [ROLES.STUDENT]);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${session.user.name ?? session.user.email}. Here is your system overview.`}
        breadcrumbs={[{ label: "Dashboard" }]}
      />

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Account Summary</CardTitle>
          <CardDescription>
            Your current signed-in access information.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Signed In As"
            value={session.user.name ?? session.user.email}
            description={session.user.email ?? ""}
            tone="info"
          />
          <StatCard
            label="Role"
            value={session.user.role}
            description="Current access level"
            tone="default"
          />
          <StatCard
            label="Today"
            value={stats.today}
            description="Current attendance date"
            tone="default"
          />
        </CardContent>
      </Card>

      {canSeeSystemStats ? (
        <>
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                System Overview
              </h2>
              <p className="text-sm text-slate-600">
                Key counts across users, students, and sections.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <StatCard
                label="Total Users"
                value={stats.totalUsers}
                description="All active and inactive system users"
                icon={<Users className="h-5 w-5 text-slate-700" />}
                tone="info"
              />
              <StatCard
                label="Total Students"
                value={stats.totalStudents}
                description="Students registered in the system"
                icon={<GraduationCap className="h-5 w-5 text-slate-700" />}
                tone="success"
              />
              <StatCard
                label="Total Sections"
                value={stats.totalSections}
                description="Available class sections"
                icon={<School className="h-5 w-5 text-slate-700" />}
                tone="default"
              />
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                Attendance Today
              </h2>
              <p className="text-sm text-slate-600">
                Daily summary for attendance statuses.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Present"
                value={stats.presentToday}
                description="Students marked present"
                icon={<CheckCircle2 className="h-5 w-5 text-emerald-700" />}
                tone="success"
              />
              <StatCard
                label="Late"
                value={stats.lateToday}
                description="Students marked late"
                icon={<Clock3 className="h-5 w-5 text-amber-700" />}
                tone="warning"
              />
              <StatCard
                label="Absent"
                value={stats.absentToday}
                description="Students marked absent"
                icon={<XCircle className="h-5 w-5 text-rose-700" />}
                tone="danger"
              />
              <StatCard
                label="Excused"
                value={stats.excusedToday}
                description="Students marked excused"
                icon={<FileCheck className="h-5 w-5 text-sky-700" />}
                tone="info"
              />
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                Analytics
              </h2>
              <p className="text-sm text-slate-600">
                Visual summary of attendance data.
              </p>
            </div>

            <DashboardCharts
              attendanceStatusData={stats.attendanceStatusData}
              sectionAttendanceData={stats.sectionAttendanceData}
            />
          </section>
        </>
      ) : (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Student Overview</CardTitle>
            <CardDescription>
              Use the sidebar to view your attendance and profile details.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Your dashboard is focused on your account, attendance records, and profile information.
          </CardContent>
        </Card>
      )}
    </div>
  );
}