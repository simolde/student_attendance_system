import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasRole, ROLES } from "@/lib/rbac";
import DashboardTopbar from "@/components/layout/dashboard-topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileBarChart2,
  ClipboardList,
  ArrowRight,
  CalendarDays,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

const quickLinks = [
  {
    title: "Attendance Reports",
    description: "Review attendance summaries by date and section.",
    href: "/dashboard/reports/attendance",
    icon: ClipboardList,
  },
];

export default async function ReportsHomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (
    !hasRole(session.user.role, [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.TEACHER,
      ROLES.STAFF,
    ])
  ) {
    redirect("/unauthorized");
  }

  const displayName = session.user.name ?? session.user.email ?? "User";

  return (
    <div className="portal-shell space-y-6">
      <DashboardTopbar
        title="Reports Home"
        subtitle="Quick access to your reporting pages."
        userName={displayName}
      />

      <section className="portal-card overflow-hidden border-0 p-0">
        <div className="portal-hero relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_28%)]" />
          <div className="relative px-6 py-8 text-white md:px-8 md:py-10">
            <div className="space-y-4">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                Reporting Navigation Hub
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Open your report pages quickly
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-blue-50/90 md:text-base">
                  Start from this page when you want to review attendance reports
                  and reporting summaries in the portal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-2">
        {quickLinks.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.href} className="portal-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-900">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <p className="text-sm leading-6 text-slate-600">{item.description}</p>

                <Link
                  href={item.href}
                  className="inline-flex h-11 items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
                >
                  Open Page
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <Card className="portal-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <FileBarChart2 className="h-4 w-4 text-sky-600" />
              Reports Module
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">Active</div>
          </CardContent>
        </Card>

        <Card className="portal-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <CalendarDays className="h-4 w-4 text-amber-600" />
              Daily Summaries
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">Ready</div>
          </CardContent>
        </Card>

        <Card className="portal-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <ShieldCheck className="h-4 w-4 text-violet-600" />
              Access
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">Authorized</div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}