import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/logout-button";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-2">Welcome, {session.user.name ?? session.user.email}</p>
      <p className="mt-1">Role: {session.user.role}</p>

      <div className="mt-6 flex flex-col gap-3">
        <Link href="/dashboard/admin" className="rounded border px-4 py-2">
          Go to Admin Dashboard
        </Link>

        <Link href="/dashboard/teacher" className="rounded border px-4 py-2">
          Go to Teacher Dashboard
        </Link>

        <Link href="/dashboard/student" className="rounded border px-4 py-2">
          Go to Student Dashboard
        </Link>
      </div>

      <LogoutButton />
    </div>
  );
}