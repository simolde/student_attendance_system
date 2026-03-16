import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasRole, ROLES } from "@/lib/rbac";

export default async function StudentDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasRole(session.user.role, [ROLES.STUDENT])) {
    redirect("/unauthorized");
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Student Dashboard</h1>
      <p className="mt-2">Welcome, {session.user.name ?? session.user.email}</p>
      <p className="mt-1">Role: {session.user.role}</p>
      <p className="mt-4">Only students can view this page.</p>
    </div>
  );
}