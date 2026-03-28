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
  Bell,
  ShieldCheck,
  CalendarDays,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const stats = await getDashboardStats();
  const role = session.user.role;
  const canSeeSystemStats = !hasRole(role, [ROLES.STUDENT]);

  const displayName = session.user.name ?? session.user.email ?? "User";

  return (
    <div className="portal-shell space-y-8">
      <section className="portal-card overflow-hidden border-0 p-0">
        <div className="portal-hero relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_25%)]" />
          <div className="relative grid gap-6 px-6 py-8 md:px-8 md:py-10 xl:grid-cols-[1.45fr_0.95fr] xl:items-center">
            <div className="space-y-5 text-white">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                Smart School Attendance Portal
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl xl:text-5xl">
                  Welcome back, {displayName}
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-blue-50/90 md:text-base">
                  Monitor attendance, review activity, and keep your school
                  operations organized with a cleaner, school-focused dashboard.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
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
                    {role}
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

            <div className="portal-card-soft border-white/20 bg-white/12 p-5 text-white backdrop-blur-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-blue-100/80">
                    Quick Overview
                  </p>
                  <h2 className="mt-2 text-xl font-semibold">
                    Today at a glance
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
                    {stats.presentToday +
                      stats.lateToday +
                      stats.absentToday +
                      stats.excusedToday}
                  </div>
                </div>

                <div className="rounded-2xl bg-white/10 p-4">
                  <div className="flex items-center gap-2 text-blue-100">
                    <Bell className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-[0.16em]">
                      Focus Area
                    </span>
                  </div>
                  <div className="mt-2 text-sm font-semibold leading-6">
                    Review attendance trends and keep class records updated.
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2 text-sm font-medium text-white/90">
                <span>School operations overview</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {canSeeSystemStats ? (
        <>
          <section className="space-y-4">
            <div>
              <h2 className="portal-section-title">School Overview</h2>
              <p className="portal-section-desc">
                Core counts across users, students, and sections for quick
                monitoring.
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
            <div>
              <h2 className="portal-section-title">Attendance Today</h2>
              <p className="portal-section-desc">
                Daily status summary for present, late, absent, and excused
                students.
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

          <section className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
            <Card className="portal-card">
              <CardContent className="p-6 md:p-7">
                <div className="mb-5">
                  <h2 className="portal-section-title">Attendance Analytics</h2>
                  <p className="portal-section-desc">
                    Visual summary of attendance distribution and section
                    activity.
                  </p>
                </div>

                <DashboardCharts
                  attendanceStatusData={stats.attendanceStatusData}
                  sectionAttendanceData={stats.sectionAttendanceData}
                />
              </CardContent>
            </Card>

            <Card className="portal-card">
              <CardContent className="p-6 md:p-7">
                <div className="mb-5">
                  <h2 className="portal-section-title">Operations Notes</h2>
                  <p className="portal-section-desc">
                    Quick reminders for daily attendance monitoring.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="portal-card-soft p-4">
                    <div className="portal-chip">Attendance Focus</div>
                    <p className="mt-3 text-sm leading-6 text-slate-700">
                      Check late and absent counts early to spot sections that
                      may need follow-up.
                    </p>
                  </div>

                  <div className="portal-card-soft p-4">
                    <div className="portal-chip">Data Accuracy</div>
                    <p className="mt-3 text-sm leading-6 text-slate-700">
                      Review manual attendance updates and confirm remarks before
                      finalizing records.
                    </p>
                  </div>

                  <div className="portal-card-soft p-4">
                    <div className="portal-chip">Daily Review</div>
                    <p className="mt-3 text-sm leading-6 text-slate-700">
                      Use the attendance history page to verify status changes,
                      time logs, and section activity.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </>
      ) : (
        <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
          <Card className="portal-card overflow-hidden border-0 p-0">
            <div className="portal-hero px-6 py-8 text-white md:px-8">
              <div className="max-w-2xl space-y-3">
                <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium">
                  Student Portal
                </div>
                <h2 className="text-2xl font-bold md:text-3xl">
                  Your dashboard is ready
                </h2>
                <p className="text-sm leading-6 text-blue-50/90 md:text-base">
                  View your attendance, keep track of school activity, and stay
                  updated with your profile information.
                </p>
              </div>
            </div>
          </Card>

          <Card className="portal-card">
            <CardContent className="p-6">
              <h3 className="portal-section-title">Student Overview</h3>
              <p className="portal-section-desc mt-1">
                Use the sidebar to access your attendance records and profile
                details.
              </p>

              <div className="mt-6 grid gap-3">
                <div className="portal-card-soft p-4">
                  <div className="text-sm font-semibold text-slate-900">
                    Account
                  </div>
                  <div className="mt-1 text-sm text-slate-600">{displayName}</div>
                </div>

                <div className="portal-card-soft p-4">
                  <div className="text-sm font-semibold text-slate-900">Role</div>
                  <div className="mt-1 text-sm text-slate-600">{role}</div>
                </div>

                <div className="portal-card-soft p-4">
                  <div className="text-sm font-semibold text-slate-900">
                    Attendance Date
                  </div>
                  <div className="mt-1 text-sm text-slate-600">{stats.today}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}