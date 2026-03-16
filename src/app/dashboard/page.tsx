import { auth } from "@/auth";
import { redirect } from "next/navigation";
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

      <LogoutButton />
    </div>
  );
}