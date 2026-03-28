import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasRole, ROLES } from "@/lib/rbac";
import DashboardTopbar from "@/components/layout/dashboard-topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ClipboardCheck,
  ScrollText,
  FileBarChart2,
  Bell,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const quickLinks = [
  {
    title: "Attendance Recording",
    description: "Open daily attendance entry for your class sections.",
    href: "/dashboard/teacher/attendance",
    icon: ClipboardCheck,
  },
  {
    title: "Attendance History",
    description: "Review and update saved attendance records.",
    href: "/dashboard/teacher/attendance/history",
    icon: ScrollText,
  },
  {
    title: "Teacher Reports",
    description: "Check section-based attendance summaries.",
    href: "/dashboard/teacher/reports",
    icon: FileBarChart2,
  },
  {
    title: "Announcements",
    description: "Read teacher notices and school reminders.",
    href: "/dashboard/teacher/announcements",
    icon: Bell,
  },
];

export default async function TeacherHomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasRole(session.user.role, [ROLES.TEACHER])) {
    redirect("/unauthorized");
  }

  const displayName = session.user.name ?? session.user.email ?? "Teacher";

  return (
    <div className="portal-shell space-y-6">
      <DashboardTopbar
        title="Teacher Home"
        subtitle="Quick access to your main teaching and attendance tools."
        userName={displayName}
      />

      <section className="portal-card overflow-hidden border-0 p-0">
        <div className="portal-hero relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_28%)]" />
          <div className="relative px-6 py-8 text-white md:px-8 md:py-10">
            <div className="space-y-4">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                Teacher Navigation Hub
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Start from your teacher shortcuts
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-blue-50/90 md:text-base">
                  Open attendance recording, history, reports, and announcements
                  from one simple teacher home page.
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

      <Card className="portal-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold text-slate-900">
            Teacher Portal Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="portal-card-soft p-4">
            <div className="text-sm font-semibold text-slate-900">Daily Workflow</div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use this page as your starting point for attendance entry, review,
              reporting, and teacher notices.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}