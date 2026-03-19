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
        description="View and edit attendance by section and date."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Teacher", href: "/dashboard/teacher" },
          { label: "Attendance History" },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>
            Load saved attendance, edit records, or export CSV.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <TableToolbar>
            <form method="GET" className="grid flex-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium">Section</label>
                <select
                  name="sectionId"
                  defaultValue={selectedSectionId}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
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
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
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
            <p className="text-sm text-muted-foreground">
              Please select a section and load history.
            </p>
          ) : records.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No attendance records found.
            </p>
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