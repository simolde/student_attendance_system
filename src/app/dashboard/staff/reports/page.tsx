import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DashboardTopbar from "@/components/layout/dashboard-topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileBarChart2,
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
    present: 28,
    late: 2,
    absent: 1,
    excused: 0,
  },
  {
    id: "2",
    section: "Grade 2 - A",
    present: 31,
    late: 1,
    absent: 0,
    excused: 1,
  },
  {
    id: "3",
    section: "Grade 3 - A",
    present: 30,
    late: 3,
    absent: 2,
    excused: 1,
  },
];

export default async function StaffReportsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const displayName = session.user.name ?? session.user.email ?? "Staff";

  const totalPresent = demoRows.reduce((sum, row) => sum + row.present, 0);
  const totalLate = demoRows.reduce((sum, row) => sum + row.late, 0);
  const totalAbsent = demoRows.reduce((sum, row) => sum + row.absent, 0);
  const totalExcused = demoRows.reduce((sum, row) => sum + row.excused, 0);

  return (
    <div className="portal-shell space-y-6">
      <DashboardTopbar
        title="Staff Reports"
        subtitle="Review operational attendance summaries and section totals."
        userName={displayName}
      />

      <section className="portal-card overflow-hidden border-0 p-0">
        <div className="portal-hero relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_28%)]" />
          <div className="relative grid gap-6 px-6 py-8 text-white md:px-8 md:py-10 xl:grid-cols-[1.45fr_0.95fr]">
            <div className="space-y-4">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                Staff Attendance Reporting
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Review attendance summaries
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-blue-50/90 md:text-base">
                  Monitor section attendance totals and daily operational summaries
                  from the staff portal.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <CalendarDays className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Report Period
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">Today</div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <FileBarChart2 className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Sections
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
            <div className="mt-2 text-2xl font-bold text-slate-900">{totalPresent}</div>
          </CardContent>
        </Card>

        <Card className="portal-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock3 className="h-4 w-4 text-amber-600" />
              Late
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{totalLate}</div>
          </CardContent>
        </Card>

        <Card className="portal-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <XCircle className="h-4 w-4 text-rose-600" />
              Absent
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{totalAbsent}</div>
          </CardContent>
        </Card>

        <Card className="portal-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <FileCheck className="h-4 w-4 text-sky-600" />
              Excused
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{totalExcused}</div>
          </CardContent>
        </Card>
      </section>

      <Card className="portal-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
            <FileBarChart2 className="h-5 w-5 text-slate-700" />
            Section Attendance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Section</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Present</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Late</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Absent</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Excused</th>
                  </tr>
                </thead>
                <tbody>
                  {demoRows.map((row) => (
                    <tr key={row.id} className="border-t border-slate-100">
                      <td className="px-4 py-4 font-medium text-slate-900">{row.section}</td>
                      <td className="px-4 py-4 text-slate-700">{row.present}</td>
                      <td className="px-4 py-4 text-slate-700">{row.late}</td>
                      <td className="px-4 py-4 text-slate-700">{row.absent}</td>
                      <td className="px-4 py-4 text-slate-700">{row.excused}</td>
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