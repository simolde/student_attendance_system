import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasRole, ROLES } from "@/lib/rbac";
import DashboardTopbar from "@/components/layout/dashboard-topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LifeBuoy,
  ShieldCheck,
  Users,
  GraduationCap,
  Radio,
  FileBarChart2,
  CircleHelp,
} from "lucide-react";

const helpItems = [
  {
    title: "User Management",
    description:
      "Manage user roles, active status, password change requirements, and account access.",
    icon: Users,
  },
  {
    title: "Student Records",
    description:
      "Review student data, sections, school years, enrollments, and import history.",
    icon: GraduationCap,
  },
  {
    title: "RFID Monitoring",
    description:
      "Check RFID logs, unknown cards, duplicate scans, denied access, and device activity.",
    icon: Radio,
  },
  {
    title: "Reports",
    description:
      "Open attendance reports and review summaries for validation and operational review.",
    icon: FileBarChart2,
  },
];

export default async function AdminHelpPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasRole(session.user.role, [ROLES.SUPER_ADMIN, ROLES.ADMIN])) {
    redirect("/unauthorized");
  }

  const displayName = session.user.name ?? session.user.email ?? "Admin";

  return (
    <div className="portal-shell space-y-6">
      <DashboardTopbar
        title="Admin Help"
        subtitle="Quick guidance for administrator workflows and portal features."
        userName={displayName}
      />

      <section className="portal-card overflow-hidden border-0 p-0">
        <div className="portal-hero relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_28%)]" />
          <div className="relative grid gap-6 px-6 py-8 text-white md:px-8 md:py-10 xl:grid-cols-[1.45fr_0.95fr]">
            <div className="space-y-4">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                Administrator Help Center
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Help for administrator tasks
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-blue-50/90 md:text-base">
                  Use this page as a quick guide for managing users, students, RFID,
                  reports, and other administrative workflows in the portal.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <LifeBuoy className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Help Topics
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{helpItems.length}</div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Access Level
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">Administrator</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-2">
        {helpItems.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.title} className="portal-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-900">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm leading-6 text-slate-600">{item.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Card className="portal-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
            <CircleHelp className="h-5 w-5 text-slate-700" />
            Admin Support Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="portal-card-soft p-4">
            <div className="text-sm font-semibold text-slate-900">Recommended Flow</div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Start with dashboard summaries, then move to users, students, RFID, rules, and reports depending on the task.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}