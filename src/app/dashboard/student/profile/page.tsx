import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasRole, ROLES } from "@/lib/rbac";
import DashboardTopbar from "@/components/layout/dashboard-topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  UserCircle2,
  Mail,
  ShieldCheck,
  CalendarDays,
  GraduationCap,
} from "lucide-react";

function formatRole(role: string) {
  return role.replaceAll("_", " ");
}

export default async function StudentProfileDedicatedPage() {
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
        title="Student Profile"
        subtitle="View your student identity and portal account details."
        userName={displayName}
      />

      <section className="portal-card overflow-hidden border-0 p-0">
        <div className="portal-hero relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_28%)]" />
          <div className="relative grid gap-6 px-6 py-8 text-white md:px-8 md:py-10 xl:grid-cols-[1.45fr_0.95fr]">
            <div className="space-y-4">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                Student Account Identity
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Your student account profile
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-blue-50/90 md:text-base">
                  Review your account identity, access role, and student portal
                  information in one place.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/20 bg-white/12 p-5 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/15">
                  <UserCircle2 className="h-8 w-8" />
                </div>
                <div>
                  <div className="text-lg font-semibold">{displayName}</div>
                  <div className="text-sm text-blue-100/80">
                    {session.user.email ?? "-"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="portal-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-semibold text-slate-900">
              Student Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 pt-0 md:grid-cols-2">
            <div className="portal-card-soft p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                <UserCircle2 className="h-3.5 w-3.5" />
                Full Name
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-900">
                {session.user.name ?? "-"}
              </div>
            </div>

            <div className="portal-card-soft p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                <Mail className="h-3.5 w-3.5" />
                Email
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-900">
                {session.user.email ?? "-"}
              </div>
            </div>

            <div className="portal-card-soft p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5" />
                Role
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-900">
                {formatRole(session.user.role)}
              </div>
            </div>

            <div className="portal-card-soft p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                <GraduationCap className="h-3.5 w-3.5" />
                Portal Access
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-900">
                Student Access Enabled
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="portal-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-semibold text-slate-900">
              Profile Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="portal-card-soft p-4">
              <div className="text-sm font-semibold text-slate-900">
                Student Account
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Your profile is connected to your attendance, announcements, and portal settings.
              </p>
            </div>

            <div className="portal-card-soft p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <CalendarDays className="h-4 w-4 text-slate-600" />
                Access Summary
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Additional student information like section and school year can be connected here later.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}