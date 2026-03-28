import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DashboardTopbar from "@/components/layout/dashboard-topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  GraduationCap,
  CreditCard,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";

const linkedStudents = [
  {
    id: "1",
    name: "Sample Student",
    studentNo: "2026-0001",
    section: "Grade 3 - A",
    schoolYear: "2025-2026",
    rfidStatus: "ASSIGNED",
    todayStatus: "PRESENT",
  },
  {
    id: "2",
    name: "Another Student",
    studentNo: "2026-0002",
    section: "Grade 1 - B",
    schoolYear: "2025-2026",
    rfidStatus: "ASSIGNED",
    todayStatus: "LATE",
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

export default async function ParentChildrenPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const displayName = session.user.name ?? session.user.email ?? "Parent";

  return (
    <div className="portal-shell space-y-6">
      <DashboardTopbar
        title="Linked Students"
        subtitle="View the students connected to your parent account."
        userName={displayName}
      />

      <section className="portal-card overflow-hidden border-0 p-0">
        <div className="portal-hero relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_28%)]" />
          <div className="relative grid gap-6 px-6 py-8 text-white md:px-8 md:py-10 xl:grid-cols-[1.45fr_0.95fr]">
            <div className="space-y-4">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                Parent Student Access
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Review your linked students
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-blue-50/90 md:text-base">
                  Check student details, section assignments, RFID status, and
                  today’s attendance status from your parent portal.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <Users className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Linked Students
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{linkedStudents.length}</div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Monitored Today
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{linkedStudents.length}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        {linkedStudents.map((student) => (
          <Card key={student.id} className="portal-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-900">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <GraduationCap className="h-5 w-5" />
                </span>
                {student.name}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="portal-card-soft p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Student No
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    {student.studentNo}
                  </div>
                </div>

                <div className="portal-card-soft p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Section
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    {student.section}
                  </div>
                </div>

                <div className="portal-card-soft p-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                    <CalendarDays className="h-3.5 w-3.5" />
                    School Year
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    {student.schoolYear}
                  </div>
                </div>

                <div className="portal-card-soft p-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                    <CreditCard className="h-3.5 w-3.5" />
                    RFID Status
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    {student.rfidStatus}
                  </div>
                </div>
              </div>

              <div>
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(
                    student.todayStatus
                  )}`}
                >
                  {student.todayStatus}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}