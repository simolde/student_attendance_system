import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect } from "next/navigation";

export default async function AuditLogsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasRole(session.user.role, [ROLES.SUPER_ADMIN, ROLES.ADMIN])) {
    redirect("/unauthorized");
  }

  const logs = await prisma.auditLog.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Audit Logs</h1>
      <p className="mt-2 text-sm text-gray-600">
        Latest 100 activity records.
      </p>

      <div className="mt-6 overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-3 py-2 text-left">Date</th>
              <th className="border px-3 py-2 text-left">User</th>
              <th className="border px-3 py-2 text-left">Action</th>
              <th className="border px-3 py-2 text-left">Entity</th>
              <th className="border px-3 py-2 text-left">Entity ID</th>
              <th className="border px-3 py-2 text-left">Description</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="border px-3 py-4 text-center">
                  No audit logs yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td className="border px-3 py-2">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="border px-3 py-2">
                    {log.user?.name ?? log.user?.email ?? "System"}
                  </td>
                  <td className="border px-3 py-2">{log.action}</td>
                  <td className="border px-3 py-2">{log.entity}</td>
                  <td className="border px-3 py-2">{log.entityId ?? "-"}</td>
                  <td className="border px-3 py-2">{log.description ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}