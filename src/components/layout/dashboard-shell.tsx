import DashboardNavbar from "./dashboard-navbar";
import DashboardSidebar from "./dashboard-sidebar";
import DashboardFooter from "./dashboard-footer";

export default function DashboardShell({
  children,
  userName,
  role,
  pathname,
}: {
  children: React.ReactNode;
  userName: string;
  role: string;
  pathname: string;
}) {
  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardNavbar userName={userName} role={role} />

      <div className="flex min-h-[calc(100vh-64px-57px)]">
        <DashboardSidebar role={role} pathname={pathname} />

        <main className="flex-1">
          <div className="mx-auto max-w-7xl p-4 md:p-6">{children}</div>
        </main>
      </div>

      <DashboardFooter />
    </div>
  );
}