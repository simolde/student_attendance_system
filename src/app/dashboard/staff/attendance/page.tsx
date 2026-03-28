import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasRole, ROLES } from "@/lib/rbac";
import DashboardTopbar from "@/components/layout/dashboard-topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ClipboardCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  XCircle,
  FileCheck,
} from "lucide-react";

const demoRows = [
  {
    id: "1",
    section: "Grade 1 - A",
    student: "Sample Student 1",
    status: "PRESENT",
    date: "2026-03-28",
    remarks: "-",
  },
  {
    id: "2",
    section: "Grade 2 - A",
    student: "Sample Student 2",
    status: "LATE",
    date: "2026-03-28",
    remarks: "Late arrival",
  },
  {
    id: "3",
    section: "Grade 3 - A",
    student: "Sample Student 3",
    status: "EXCUSED",
    date: "2026-03-28",
    remarks: "Medical reason",
  },
];

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "PRESENT":
      return "border-green-200 bg-green-50 text-green-700";
    case "LATE":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "ABSENT":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "EXCUSED":
      return "border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export default async function StaffAttendancePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasRole(session.user.role, [ROLES.STAFF])) {
    redirect("/unauthorized");
  }

  const displayName = session.user.name ?? session.user.email ?? "Staff";

  const presentCount = demoRows.filter((row) => row.status === "PRESENT").length;
  const lateCount = demoRows.filter((row) => row.status === "LATE").length;
  const absentCount = demoRows.filter((row) => row.status === "ABSENT").length;
  const excusedCount = demoRows.filter((row) => row.status === "EXCUSED").length;

  return (
    <div className="portal-shell space-y-6">
      <DashboardTopbar
        title="Staff Attendance View"
        subtitle="Review attendance entries and support daily attendance operations."
        userName={displayName}
      />

      <section className="portal-card overflow-hidden border-0 p-0">
        <div className="portal-hero relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_28%)]" />
          <div className="relative grid gap-6 px-6 py-8 text-white md:px-8 md:py-10 xl:grid-cols-[1.45fr_0.95fr]">
            <div className="space-y-4">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                Staff Attendance Support
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Review attendance for operational support
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-blue-50/90 md:text-base">
                  Check student attendance records, daily status, and remarks to help
                  validate attendance workflows.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <CalendarDays className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Date
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">2026-03-28</div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <ClipboardCheck className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Records
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{demoRows.length}</div>
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
              Present
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{presentCount}</div>
          </CardContent>
        </Card>

        <Card className="portal-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock3 className="h-4 w-4 text-amber-600" />
              Late
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{lateCount}</div>
          </CardContent>
        </Card>

        <Card className="portal-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <XCircle className="h-4 w-4 text-rose-600" />
              Absent
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{absentCount}</div>
          </CardContent>
        </Card>

        <Card className="portal-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <FileCheck className="h-4 w-4 text-sky-600" />
              Excused
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{excusedCount}</div>
          </CardContent>
        </Card>
      </section>

      <Card className="portal-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold text-slate-900">
            Attendance Support Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Section</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Student</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {demoRows.map((row) => (
                    <tr key={row.id} className="border-t border-slate-100">
                      <td className="px-4 py-4 text-slate-700">{row.date}</td>
                      <td className="px-4 py-4 text-slate-700">{row.section}</td>
                      <td className="px-4 py-4 font-medium text-slate-900">{row.student}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(
                            row.status
                          )}`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{row.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}