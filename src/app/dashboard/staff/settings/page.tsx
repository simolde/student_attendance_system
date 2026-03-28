import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DashboardTopbar from "@/components/layout/dashboard-topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Settings,
  ShieldCheck,
  UserCircle2,
  Mail,
  Bell,
  Lock,
  Palette,
  KeyRound,
} from "lucide-react";

function formatRole(role: string) {
  return role.replaceAll("_", " ");
}

export default async function StaffSettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const displayName = session.user.name ?? session.user.email ?? "Staff";

  return (
    <div className="portal-shell space-y-6">
      <DashboardTopbar
        title="Staff Settings"
        subtitle="Manage your staff account details and portal preferences."
        userName={displayName}
      />

      <section className="portal-card overflow-hidden border-0 p-0">
        <div className="portal-hero relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_28%)]" />
          <div className="relative grid gap-6 px-6 py-8 md:px-8 md:py-10 xl:grid-cols-[1.45fr_0.95fr]">
            <div className="space-y-4 text-white">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                Staff Settings
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Configure your staff portal preferences
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-blue-50/90 md:text-base">
                  Review your account identity, staff portal preferences, and
                  future notification settings from one place.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <UserCircle2 className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Signed In
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{displayName}</div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <ShieldCheck className="h-4 w-4" />
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

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-6">
          <Card className="portal-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
                <UserCircle2 className="h-5 w-5 text-slate-700" />
                Account Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 pt-0 md:grid-cols-2">
              <div className="portal-card-soft p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Full Name
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {session.user.name ?? "-"}
                </div>
              </div>

              <div className="portal-card-soft p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {session.user.email ?? "-"}
                </div>
              </div>

              <div className="portal-card-soft p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Role
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {formatRole(session.user.role)}
                </div>
              </div>

              <div className="portal-card-soft p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Portal Access
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  Enabled
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="portal-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
                <Lock className="h-5 w-5 text-slate-700" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="portal-card-soft p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      Password Security
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      Update your staff portal password when needed.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700"
                  >
                    <KeyRound className="mr-2 h-4 w-4" />
                    Change Password
                  </button>
                </div>
              </div>

              <div className="portal-card-soft p-4">
                <div className="text-sm font-semibold text-slate-900">
                  Login Protection
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  Additional sign-in activity and account protection tools can be added here later.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card className="portal-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
                <Bell className="h-5 w-5 text-slate-700" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="portal-card-soft p-4">
                <div className="text-sm font-semibold text-slate-900">
                  Operations Alerts
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  Staff attendance and operations reminders can be managed here later.
                </p>
              </div>

              <div className="portal-card-soft p-4">
                <div className="text-sm font-semibold text-slate-900">
                  School Notices
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  Important staff and school notices can be configured here.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="portal-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
                <Palette className="h-5 w-5 text-slate-700" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="portal-card-soft p-4">
                <div className="text-sm font-semibold text-slate-900">
                  Portal Theme
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  The staff portal currently uses the desktop school portal theme.
                </p>
              </div>

              <div className="portal-card-soft p-4">
                <div className="text-sm font-semibold text-slate-900">
                  Future Personalization
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  Staff dashboard preferences and layout options can be added here later.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}