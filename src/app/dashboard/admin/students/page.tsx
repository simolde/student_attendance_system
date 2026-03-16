import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { createSection, createStudent } from "./actions";

export default async function AdminStudentsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasRole(session.user.role, [ROLES.SUPER_ADMIN, ROLES.ADMIN])) {
    redirect("/unauthorized");
  }

  const sections = await prisma.section.findMany({
    orderBy: { name: "asc" },
  });

  const students = await prisma.student.findMany({
    include: {
      user: true,
      section: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Student Management</h1>
      <p className="mt-2 text-sm text-gray-600">
        Only ADMIN and SUPER_ADMIN can access this page.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Create Section</h2>

          <form action={createSection} className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Section Name
              </label>
              <input
                name="name"
                type="text"
                placeholder="e.g. Grade 7 - A"
                className="w-full rounded border px-3 py-2"
              />
            </div>

            <button
              type="submit"
              className="rounded bg-black px-4 py-2 text-white"
            >
              Add Section
            </button>
          </form>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Create Student</h2>

          <form action={createStudent} className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Full Name</label>
              <input
                name="name"
                type="text"
                placeholder="Student full name"
                className="w-full rounded border px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input
                name="email"
                type="email"
                placeholder="student@email.com"
                className="w-full rounded border px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Student Number
              </label>
              <input
                name="studentNo"
                type="text"
                placeholder="2026-0001"
                className="w-full rounded border px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Section</label>
              <select
                name="sectionId"
                className="w-full rounded border px-3 py-2"
                defaultValue=""
              >
                <option value="" disabled>
                  Select a section
                </option>
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="rounded bg-black px-4 py-2 text-white"
            >
              Add Student
            </button>
          </form>
        </div>
      </div>

      <div className="mt-10 rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Sections</h2>

        {sections.length === 0 ? (
          <p className="mt-4 text-sm text-gray-600">No sections yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {sections.map((section) => (
              <li key={section.id} className="rounded border px-3 py-2">
                {section.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-10 rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Students</h2>

        {students.length === 0 ? (
          <p className="mt-4 text-sm text-gray-600">No students yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-3 py-2 text-left">Student No</th>
                  <th className="border px-3 py-2 text-left">Name</th>
                  <th className="border px-3 py-2 text-left">Email</th>
                  <th className="border px-3 py-2 text-left">Section</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td className="border px-3 py-2">{student.studentNo}</td>
                    <td className="border px-3 py-2">{student.user.name}</td>
                    <td className="border px-3 py-2">{student.user.email}</td>
                    <td className="border px-3 py-2">
                      {student.section?.name ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}