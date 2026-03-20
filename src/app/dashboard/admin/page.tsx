import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { hasRole, ROLES } from "@/lib/rbac";
import PageHeader from "@/components/layout/page-header";
import StatCard from "@/components/ui/stat-card";
import {
  Users,
  GraduationCap,
  School,
  CheckCircle2,
  Clock3,
  XCircle,
  FileCheck,
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

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasRole(session.user.role, [ROLES.SUPER_ADMIN, ROLES.ADMIN])) {
    redirect("/unauthorized");
  }

  const { start, end } = getTodayRange();

  const [
    totalUsers,
    totalStudents,
    totalSections,
    presentToday,
    lateToday,
    absentToday,
    excusedToday,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.student.count(),
    prisma.section.count(),
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
        title="Admin Dashboard"
        description="Manage users, students, sections, attendance records, and audit logs."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin" },
        ]}
      />

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            System Overview
          </h2>
          <p className="text-sm text-slate-600">
            High-level counts across the whole system.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <StatCard
            label="Total Users"
            value={totalUsers}
            description="All accounts in the system"
            icon={<Users className="h-5 w-5 text-slate-700" />}
            tone="info"
          />
          <StatCard
            label="Total Students"
            value={totalStudents}
            description="Registered student profiles"
            icon={<GraduationCap className="h-5 w-5 text-slate-700" />}
            tone="success"
          />
          <StatCard
            label="Total Sections"
            value={totalSections}
            description="Available class sections"
            icon={<School className="h-5 w-5 text-slate-700" />}
            tone="default"
          />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Attendance Today
          </h2>
          <p className="text-sm text-slate-600">
            Daily attendance summary for administrators.
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
          <CardTitle>Administrator Notes</CardTitle>
          <CardDescription>
            Use the sidebar to access user management, student management, and audit logs.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          This dashboard is intended for full system administration. Review daily attendance,
          manage records, and monitor key system activity from the admin tools.
        </CardContent>
      </Card>
    </div>
  );
}