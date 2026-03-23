"use client";

import DashboardSidebar from "./dashboard-sidebar";
import DashboardNavbar from "./dashboard-navbar";
import DashboardFooter from "./dashboard-footer";
import { DashboardLayoutProvider, useDashboardLayout } from "./dashboard-context";

function ShellContent({
  children,
  userName,
  userEmail,
  role,
  userImage,
  mustChangePassword,
}: {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
  role: string;
  userImage: string | null;
  mustChangePassword: boolean;
}) {
  useDashboardLayout();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <DashboardSidebar
          role={role}
          userName={userName}
          userEmail={userEmail}
          userImage={userImage}
          mustChangePassword={mustChangePassword}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardNavbar />

          <main className="flex-1">
            <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
              {children}
            </div>
          </main>

          <DashboardFooter />
        </div>
      </div>
    </div>
  );
}

export default function DashboardShell({
  children,
  userName,
  userEmail,
  role,
  userImage,
  mustChangePassword,
}: {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
  role: string;
  userImage: string | null;
  mustChangePassword: boolean;
}) {
  return (
    <DashboardLayoutProvider>
      <ShellContent
        userName={userName}
        userEmail={userEmail}
        role={role}
        userImage={userImage}
        mustChangePassword={mustChangePassword}
      >
        {children}
      </ShellContent>
    </DashboardLayoutProvider>
  );
}