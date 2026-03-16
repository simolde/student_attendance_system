import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect } from "next/navigation";
import UserManagementForms from "./forms";

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasRole(session.user.role, [ROLES.SUPER_ADMIN, ROLES.ADMIN])) {
    redirect("/unauthorized");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">User Management</h1>
      <p className="mt-2 text-sm text-gray-600">
        Create admin, teacher, staff, and student accounts.
      </p>

      <div className="mt-8">
        <UserManagementForms />
      </div>

      <div className="mt-10 rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Users</h2>

        {users.length === 0 ? (
          <p className="mt-4 text-sm text-gray-600">No users yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-3 py-2 text-left">Name</th>
                  <th className="border px-3 py-2 text-left">Email</th>
                  <th className="border px-3 py-2 text-left">Role</th>
                  <th className="border px-3 py-2 text-left">Active</th>
                  <th className="border px-3 py-2 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="border px-3 py-2">{user.name ?? "-"}</td>
                    <td className="border px-3 py-2">{user.email}</td>
                    <td className="border px-3 py-2">{user.role}</td>
                    <td className="border px-3 py-2">
                      {user.isActive ? "Yes" : "No"}
                    </td>
                    <td className="border px-3 py-2">
                      {new Date(user.createdAt).toLocaleDateString()}
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