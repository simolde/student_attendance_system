import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect } from "next/navigation";

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
    <div className="p-6">
      <h1 className="text-2xl font-bold">Attendance History</h1>
      <p className="mt-2 text-sm text-gray-600">
        View attendance by section and date.
      </p>

      <form method="GET" className="mt-6 grid gap-4 rounded-lg border bg-white p-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Section</label>
          <select
            name="sectionId"
            defaultValue={selectedSectionId}
            className="w-full rounded border px-3 py-2"
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
          <label className="mb-1 block text-sm font-medium">Date</label>
          <input
            type="date"
            name="date"
            defaultValue={selectedDate}
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded bg-blue-600 px-4 py-2 text-white"
          >
            Load History
          </button>
        </div>
      </form>

      <div className="mt-6 overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-3 py-2 text-left">Student No</th>
              <th className="border px-3 py-2 text-left">Name</th>
              <th className="border px-3 py-2 text-left">Section</th>
              <th className="border px-3 py-2 text-left">Date</th>
              <th className="border px-3 py-2 text-left">Status</th>
              <th className="border px-3 py-2 text-left">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {!selectedSectionId ? (
              <tr>
                <td colSpan={6} className="border px-3 py-4 text-center">
                  Please select a section and load history.
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={6} className="border px-3 py-4 text-center">
                  No attendance records found.
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record.id}>
                  <td className="border px-3 py-2">{record.student.studentNo}</td>
                  <td className="border px-3 py-2">
                    {record.student.user.name ?? record.student.user.email}
                  </td>
                  <td className="border px-3 py-2">
                    {record.student.section?.name ?? "-"}
                  </td>
                  <td className="border px-3 py-2">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="border px-3 py-2">{record.status}</td>
                  <td className="border px-3 py-2">{record.remarks ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}