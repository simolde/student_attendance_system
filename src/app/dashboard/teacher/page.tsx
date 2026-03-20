import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { hasRole, ROLES } from "@/lib/rbac";
import PageHeader from "@/components/layout/page-header";
import StatCard from "@/components/ui/stat-card";
import {
  CheckCircle2,
  Clock3,
  XCircle,
  FileCheck,
  ClipboardCheck,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function getTodayRange() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export default async function TeacherDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (
    !hasRole(session.user.role, [
      ROLES.TEACHER,
      ROLES.STAFF,
      ROLES.ADMIN,
      ROLES.SUPER_ADMIN,
    ])
  ) {
    redirect("/unauthorized");
  }

  const { start, end } = getTodayRange();

  const [presentToday, lateToday, absentToday, excusedToday] =
    await Promise.all([
      prisma.attendance.count({
        where: {
          date: { gte: start, lte: end },
          status: "PRESENT",
        },
      }),
      prisma.attendance.count({
        where: {
          date: { gte: start, lte: end },
          status: "LATE",
        },
      }),
      prisma.attendance.count({
        where: {
          date: { gte: start, lte: end },
          status: "ABSENT",
        },
      }),
      prisma.attendance.count({
        where: {
          date: { gte: start, lte: end },
          status: "EXCUSED",
        },
      }),
    ]);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Teacher Dashboard"
        description="Record attendance and review attendance history."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Teacher" },
        ]}
      />

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Daily Attendance Summary
          </h2>
          <p className="text-sm text-slate-600">
            Overview of attendance records for today.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Present"
            value={presentToday}
            description="Students marked present"
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-700" />}
            tone="success"
          />
          <StatCard
            label="Late"
            value={lateToday}
            description="Students marked late"
            icon={<Clock3 className="h-5 w-5 text-amber-700" />}
            tone="warning"
          />
          <StatCard
            label="Absent"
            value={absentToday}
            description="Students marked absent"
            icon={<XCircle className="h-5 w-5 text-rose-700" />}
            tone="danger"
          />
          <StatCard
            label="Excused"
            value={excusedToday}
            description="Students marked excused"
            icon={<FileCheck className="h-5 w-5 text-sky-700" />}
            tone="info"
          />
        </div>
      </section>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Teacher Workflow</CardTitle>
          <CardDescription>
            Your main tasks are attendance recording and reviewing attendance history.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-start gap-3 text-sm text-slate-600">
          <ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
          <p>
            Use the sidebar to record attendance by section and date, then review or edit
            saved records from the attendance history page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}