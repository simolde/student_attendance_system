import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { hasRole, ROLES } from "@/lib/rbac";
import PageHeader from "@/components/layout/page-header";
import StatCard from "@/components/ui/stat-card";
import {
  UserCircle2,
  ClipboardCheck,
  School,
  CheckCircle2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default async function StudentDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasRole(session.user.role, [ROLES.STUDENT])) {
    redirect("/unauthorized");
  }

  const student = await prisma.student.findUnique({
    where: {
      userId: session.user.id,
    },
    include: {
      user: true,
      section: true,
      attendances: true,
    },
  });

  const presentCount =
    student?.attendances.filter((a) => a.status === "PRESENT").length ?? 0;

  const displayName =
    student?.user.name ?? session.user.name ?? session.user.email ?? "Student";

  const initials = getInitials(displayName);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Student Dashboard"
        description="View your attendance and profile information."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Student" },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Profile Summary</CardTitle>
            <CardDescription>
              Your basic student account information.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={student?.user.image ?? session.user.image ?? undefined}
                  alt={displayName}
                />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>

              <h2 className="mt-4 text-lg font-semibold text-slate-900">
                {displayName}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {student?.user.email ?? session.user.email}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Student Number
              </p>
              <p className="mt-2 text-sm font-medium text-slate-900">
                {student?.studentNo ?? "-"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Section
              </p>
              <p className="mt-2 text-sm font-medium text-slate-900">
                {student?.section?.name ?? "-"}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                Attendance Overview
              </h2>
              <p className="text-sm text-slate-600">
                Summary of your student attendance records.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <StatCard
                label="Total Records"
                value={student?.attendances.length ?? 0}
                description="Saved attendance entries"
                icon={<ClipboardCheck className="h-5 w-5 text-slate-700" />}
                tone="info"
              />
              <StatCard
                label="Present Count"
                value={presentCount}
                description="Times marked present"
                icon={<CheckCircle2 className="h-5 w-5 text-emerald-700" />}
                tone="success"
              />
              <StatCard
                label="Section"
                value={student?.section?.name ?? "-"}
                description="Current assigned section"
                icon={<School className="h-5 w-5 text-slate-700" />}
                tone="default"
              />
            </div>
          </section>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Student Notes</CardTitle>
              <CardDescription>
                Use the sidebar to view your attendance details and profile information.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-start gap-3 text-sm text-slate-600">
              <UserCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
              <p>
                Your dashboard is focused on your own records only. Open My Attendance
                or My Profile from the sidebar to see more details.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}