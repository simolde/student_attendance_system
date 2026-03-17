import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/logout-button";
import { getDashboardStats } from "@/lib/dashboard";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const stats = await getDashboardStats();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-2">Welcome, {session.user.name ?? session.user.email}</p>
      <p className="mt-1">Role: {session.user.role}</p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-600">Total Users</p>
          <h2 className="mt-2 text-3xl font-bold">{stats.totalUsers}</h2>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-600">Total Students</p>
          <h2 className="mt-2 text-3xl font-bold">{stats.totalStudents}</h2>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-600">Total Sections</p>
          <h2 className="mt-2 text-3xl font-bold">{stats.totalSections}</h2>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold">
          Attendance Today ({stats.today})
        </h2>

        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-600">Present</p>
            <h3 className="mt-2 text-2xl font-bold">{stats.presentToday}</h3>
          </div>

          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-600">Late</p>
            <h3 className="mt-2 text-2xl font-bold">{stats.lateToday}</h3>
          </div>

          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-600">Absent</p>
            <h3 className="mt-2 text-2xl font-bold">{stats.absentToday}</h3>
          </div>

          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-600">Excused</p>
            <h3 className="mt-2 text-2xl font-bold">{stats.excusedToday}</h3>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3">
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