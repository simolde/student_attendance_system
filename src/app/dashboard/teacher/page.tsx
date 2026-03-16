import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasRole, ROLES } from "@/lib/rbac";
import Link from "next/link";

export default async function TeacherDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (
    !hasRole(session.user.role, [
      ROLES.TEACHER,
      ROLES.STAFF,
      ROLES.ADMIN,
      ROLES.SUPER_ADMIN,
    ])
  ) {
    redirect("/unauthorized");
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
      <p className="mt-2">Welcome, {session.user.name ?? session.user.email}</p>
      <p className="mt-1">Role: {session.user.role}</p>

      <div className="mt-6">
        <Link
          href="/dashboard/teacher/attendance"
          className="inline-block rounded border px-4 py-2"
        >
          Go to Attendance Recording
        </Link>
      </div>
    </div>
  );
}