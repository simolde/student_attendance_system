import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasRole, ROLES } from "@/lib/rbac";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasRole(session.user.role, [ROLES.SUPER_ADMIN, ROLES.ADMIN])) {
    redirect("/unauthorized");
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <p className="mt-2">Welcome, {session.user.name ?? session.user.email}</p>
      <p className="mt-1">Role: {session.user.role}</p>

      <div className="mt-6">
        <Link
          href="/dashboard/admin/students"
          className="inline-block rounded border px-4 py-2"
        >
          Go to Student Management
        </Link>
      </div>
    </div>
  );
}