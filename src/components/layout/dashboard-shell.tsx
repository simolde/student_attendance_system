import DashboardNavbar from "./dashboard-navbar";
import DashboardSidebar from "./dashboard-sidebar";
import DashboardFooter from "./dashboard-footer";

export default function DashboardShell({
  children,
  userName,
  userEmail,
  role,
}: {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
  role: string;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNavbar userName={userName} userEmail={userEmail} role={role} />

      <div className="flex min-h-[calc(100vh-64px-57px)]">
        <DashboardSidebar role={role} />

        <main className="flex-1">
          <div className="mx-auto max-w-7xl p-4 md:p-6">{children}</div>
        </main>
      </div>

      <DashboardFooter />
    </div>
  );
}