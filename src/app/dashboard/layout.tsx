import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/layout/dashboard-shell";
import { headers } from "next/headers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const headersList = await headers();
  const pathname = headersList.get("x-current-path") ?? "/dashboard";

  return (
    <DashboardShell
      userName={session.user.name ?? session.user.email ?? "User"}
      role={session.user.role}
      pathname={pathname}
    >
      {children}
    </DashboardShell>
  );
}