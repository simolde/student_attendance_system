import type { ReactNode } from "react";
import DashboardSidebar from "./dashboard-sidebar";

export default function DashboardShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto flex min-h-screen max-w-[1700px]">
        <DashboardSidebar />

        <main className="min-w-0 flex-1">
          <div className="px-4 py-4 md:px-6 md:py-6 xl:px-8 xl:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}