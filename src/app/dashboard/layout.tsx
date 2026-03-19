import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <DashboardShell
      userName={session.user.name ?? session.user.email ?? "User"}
      userEmail={session.user.email ?? ""}
      role={session.user.role}
    >
      {children}
    </DashboardShell>
  );
}