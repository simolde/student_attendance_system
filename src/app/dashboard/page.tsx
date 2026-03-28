import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getDashboardStats } from "@/lib/dashboard";
import { hasRole, ROLES } from "@/lib/rbac";
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
  ShieldCheck,
  CalendarDays,
  Bell,
  ClipboardList,
  BookOpenText,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardTopbar from "@/components/layout/dashboard-topbar";

function formatRole(role: string) {
  return role.replaceAll("_", " ");
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const stats = await getDashboardStats();
  const role = session.user.role;
  const canSeeSystemStats = !hasRole(role, [ROLES.STUDENT]);
  const displayName = session.user.name ?? session.user.email ?? "User";

  const totalAttendanceToday =
    stats.presentToday +
    stats.lateToday +
    stats.absentToday +
    stats.excusedToday;

  return (
    <div className="portal-shell space-y-8">
      <DashboardTopbar
        title="Dashboard"
        subtitle="Monitor attendance, records, and school activity."
        userName={displayName}
      />
      <section className="portal-card overflow-hidden border-0 p-0">
        <div className="portal-hero relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_28%)]" />
          <div className="relative grid gap-8 px-6 py-8 md:px-8 md:py-10 xl:grid-cols-[1.45fr_0.95fr]">
            <div className="space-y-6 text-white">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                StarDigiTech School Attendance Portal
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl xl:text-5xl">
                  Welcome back, {displayName}
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-blue-50/90 md:text-base">
                  Manage attendance, monitor records, and review school activity
                  in a cleaner desktop portal built for daily operations.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <div className="text-xs uppercase tracking-[0.18em] text-blue-100/80">
                    Signed In
                  </div>
                  <div className="mt-2 line-clamp-2 text-sm font-semibold md:text-base">
                    {displayName}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <div className="text-xs uppercase tracking-[0.18em] text-blue-100/80">
                    Access Role
                  </div>
                  <div className="mt-2 text-sm font-semibold md:text-base">
                    {formatRole(role)}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <div className="text-xs uppercase tracking-[0.18em] text-blue-100/80">
                    Attendance Date
                  </div>
                  <div className="mt-2 text-sm font-semibold md:text-base">
                    {stats.today}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 self-stretch">
              <div className="rounded-3xl border border-white/20 bg-white/12 p-5 text-white backdrop-blur-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-blue-100/80">
                      Daily Overview
                    </p>
                    <h2 className="mt-2 text-xl font-semibold">
                      School operations snapshot
                    </h2>
                  </div>
                  <div className="rounded-2xl bg-white/15 p-3">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/10 p-4">
                    <div className="flex items-center gap-2 text-blue-100">
                      <CalendarDays className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-[0.16em]">
                        Records Today
                      </span>
                    </div>
                    <div className="mt-2 text-2xl font-bold">
                      {totalAttendanceToday}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/10 p-4">
                    <div className="flex items-center gap-2 text-blue-100">
                      <Bell className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-[0.16em]">
                        Portal Focus
                      </span>
                    </div>
                    <div className="mt-2 text-sm font-semibold leading-6">
                      Review attendance, track sections, and keep school records accurate.
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                  <div className="flex items-center gap-2 text-blue-100">
                    <ClipboardList className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-[0.16em]">
                      Monitoring
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-blue-50/90">
                    Check late and absent counts early for faster follow-up.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                  <div className="flex items-center gap-2 text-blue-100">
                    <BookOpenText className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-[0.16em]">
                      Records
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-blue-50/90">
                    Use attendance history to verify updates, remarks, and daily activity.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {canSeeSystemStats ? (
        <>
          <section className="space-y-4">
            <div className="flex flex-col gap-1">
              <h2 className="portal-section-title">System Overview</h2>
              <p className="portal-section-desc">
                Key counts across users, students, and sections.
              </p>
            </div>

            <div className="portal-grid md:grid-cols-3">
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
            <div className="flex flex-col gap-1">
              <h2 className="portal-section-title">Attendance Today</h2>
              <p className="portal-section-desc">
                Daily status summary for school attendance.
              </p>
            </div>

            <div className="portal-grid md:grid-cols-2 xl:grid-cols-4">
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

          <section className="grid gap-6 2xl:grid-cols-[1.7fr_0.9fr]">
            <Card className="portal-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-semibold text-slate-900">
                  Attendance Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="mb-5 text-sm text-slate-600">
                  Visual summary of attendance distribution and section activity.
                </p>

                <DashboardCharts
                  attendanceStatusData={stats.attendanceStatusData}
                  sectionAttendanceData={stats.sectionAttendanceData}
                />
              </CardContent>
            </Card>

            <div className="grid gap-6">
              <Card className="portal-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-semibold text-slate-900">
                    Quick Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="portal-card-soft p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="portal-chip">Daily Review</span>
                      <ArrowUpRight className="h-4 w-4 text-slate-500" />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-700">
                      Review manual attendance changes and confirm remarks before end of day.
                    </p>
                  </div>

                  <div className="portal-card-soft p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="portal-chip">Section Monitoring</span>
                      <ArrowUpRight className="h-4 w-4 text-slate-500" />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-700">
                      Watch sections with high late or absent counts for faster intervention.
                    </p>
                  </div>

                  <div className="portal-card-soft p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="portal-chip">History Verification</span>
                      <ArrowUpRight className="h-4 w-4 text-slate-500" />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-700">
                      Use the history page to verify updates, time logs, and attendance status changes.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="portal-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-semibold text-slate-900">
                    Account Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 pt-0">
                  <div className="portal-card-soft p-4">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      User
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {displayName}
                    </div>
                  </div>

                  <div className="portal-card-soft p-4">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      Role
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {formatRole(role)}
                    </div>
                  </div>

                  <div className="portal-card-soft p-4">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      Current Date
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {stats.today}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </>
      ) : (
        <section className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
          <Card className="portal-card overflow-hidden border-0 p-0">
            <div className="portal-hero px-6 py-8 text-white md:px-8 md:py-10">
              <div className="max-w-2xl space-y-3">
                <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium">
                  Student Portal
                </div>
                <h2 className="text-2xl font-bold md:text-3xl">
                  Your attendance dashboard is ready
                </h2>
                <p className="text-sm leading-6 text-blue-50/90 md:text-base">
                  View attendance records, stay updated, and monitor your school account in one place.
                </p>
              </div>
            </div>
          </Card>

          <Card className="portal-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-semibold text-slate-900">
                Student Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 pt-0">
              <div className="portal-card-soft p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Signed In
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {displayName}
                </div>
              </div>

              <div className="portal-card-soft p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Role
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {formatRole(role)}
                </div>
              </div>

              <div className="portal-card-soft p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Attendance Date
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {stats.today}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}