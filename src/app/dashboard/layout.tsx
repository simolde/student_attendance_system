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

  const mustChangePassword = session.user.mustChangePassword === true;

  // Allow access only to the change-password page until password is updated.
  // The change-password page itself should not use this layout restriction loop.
  return (
    <DashboardShell
      userName={session.user.name ?? session.user.email ?? "User"}
      userEmail={session.user.email ?? ""}
      role={session.user.role}
      userImage={session.user.image ?? null}
      mustChangePassword={mustChangePassword}
    >
      {children}
    </DashboardShell>
  );
}