import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import TableToolbar from "@/components/layout/table-toolbar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AttendanceHistoryTable from "./history-table";

export default async function AttendanceHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ sectionId?: string; date?: string }>;
}) {
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

  const params = await searchParams;
  const selectedSectionId = params.sectionId ?? "";
  const selectedDate = params.date ?? new Date().toISOString().slice(0, 10);

  const sections = await prisma.section.findMany({
    orderBy: { name: "asc" },
  });

  const records =
    selectedSectionId && selectedDate
      ? await prisma.attendance.findMany({
          where: {
            date: new Date(selectedDate),
            student: {
              sectionId: selectedSectionId,
            },
          },
          include: {
            student: {
              include: {
                user: true,
                section: true,
              },
            },
          },
          orderBy: {
            student: {
              studentNo: "asc",
            },
          },
        })
      : [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Attendance History"
        description="Review, update, or export saved attendance records."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Teacher", href: "/dashboard/teacher" },
          { label: "Attendance History" },
        ]}
      />

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>
            Load saved attendance by section and date.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <TableToolbar>
            <form method="GET" className="grid flex-1 gap-4 lg:grid-cols-[1fr_220px_auto]">
              <div>
                <label className="mb-2 block text-sm font-medium">Section</label>
                <select
                  name="sectionId"
                  defaultValue={selectedSectionId}
                  className="h-11 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">Select section</option>
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Date</label>
                <input
                  type="date"
                  name="date"
                  defaultValue={selectedDate}
                  className="h-11 w-full rounded-md border bg-background px-3 text-sm"
                />
              </div>

              <div className="flex items-end gap-2">
                <Button type="submit">Load History</Button>

                {selectedSectionId && selectedDate ? (
                  <Button type="button" variant="outline" asChild>
                    <Link
                      href={`/api/attendance/export?sectionId=${selectedSectionId}&date=${selectedDate}`}
                    >
                      Export CSV
                    </Link>
                  </Button>
                ) : null}
              </div>
            </form>
          </TableToolbar>

          {!selectedSectionId ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              Please select a section and load history.
            </div>
          ) : records.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              No attendance records found.
            </div>
          ) : (
            <AttendanceHistoryTable
              records={records.map((record) => ({
                ...record,
                status: record.status as
                  | "PRESENT"
                  | "LATE"
                  | "ABSENT"
                  | "EXCUSED",
                date: record.date.toISOString(),
              }))}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}