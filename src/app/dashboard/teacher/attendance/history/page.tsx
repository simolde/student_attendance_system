import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Attendance History</h1>
        <p className="mt-2 text-muted-foreground">
          View and edit attendance by section and date.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Select a section and date to load saved attendance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form method="GET" className="grid gap-4 md:grid-cols-3">
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

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
              >
                Load History
              </button>
            </div>
          </form>

          {selectedSectionId && selectedDate && (
            <div className="mt-4">
              <Link
                href={`/api/attendance/export?sectionId=${selectedSectionId}&date=${selectedDate}`}
                className="inline-block rounded-md bg-green-600 px-4 py-2 text-sm text-white"
              >
                Export CSV
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
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
                date: record.date.toISOString(),
              }))}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}