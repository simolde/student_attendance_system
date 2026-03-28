import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasRole, ROLES } from "@/lib/rbac";
import DashboardTopbar from "@/components/layout/dashboard-topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GraduationCap,
  CalendarDays,
  ClipboardList,
  Bell,
  UserCircle2,
  CheckCircle2,
} from "lucide-react";

function formatRole(role: string) {
  return role.replaceAll("_", " ");
}

export default async function StudentDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasRole(session.user.role, [ROLES.STUDENT])) {
    redirect("/unauthorized");
  }

  const displayName = session.user.name ?? session.user.email ?? "Student";

  return (
    <div className="portal-shell space-y-6">
      <DashboardTopbar
        title="Student Dashboard"
        subtitle="View your attendance, profile information, and school updates."
        userName={displayName}
      />

      <section className="portal-card overflow-hidden border-0 p-0">
        <div className="portal-hero relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_28%)]" />
          <div className="relative grid gap-6 px-6 py-8 md:px-8 md:py-10 xl:grid-cols-[1.45fr_0.95fr]">
            <div className="space-y-4 text-white">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                Student Portal
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Welcome back, {displayName}
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-blue-50/90 md:text-base">
                  Review your attendance, stay updated with announcements, and keep
                  track of your school portal activity.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <UserCircle2 className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Account
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{displayName}</div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <GraduationCap className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Role
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">
                  {formatRole(session.user.role)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card className="portal-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Attendance Status
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">Available Soon</div>
          </CardContent>
        </Card>

        <Card className="portal-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <CalendarDays className="h-4 w-4 text-sky-600" />
              Daily Record
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">Pending</div>
          </CardContent>
        </Card>

        <Card className="portal-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <ClipboardList className="h-4 w-4 text-amber-600" />
              Attendance Logs
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">View Soon</div>
          </CardContent>
        </Card>

        <Card className="portal-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Bell className="h-4 w-4 text-violet-600" />
              Announcements
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">Updated</div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="portal-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-semibold text-slate-900">
              Student Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="portal-card-soft p-5">
              <div className="text-sm font-semibold text-slate-900">
                Attendance Module
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Your attendance summary, logs, and daily status can be connected here next.
              </p>
            </div>

            <div className="portal-card-soft p-5">
              <div className="text-sm font-semibold text-slate-900">
                Profile Information
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Student details, section, and school year information can be shown in this area.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="portal-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-semibold text-slate-900">
              Quick Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="portal-card-soft p-4">
              <div className="portal-chip">Announcements</div>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Important notices and school reminders can be displayed here.
              </p>
            </div>

            <div className="portal-card-soft p-4">
              <div className="portal-chip">Attendance</div>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Daily attendance updates and student logs can be connected here later.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}