import DashboardSidebarNav from "./dashboard-sidebar-nav";

export default function DashboardSidebar({ role }: { role: string }) {
  return (
    <aside className="hidden w-72 shrink-0 border-r bg-white md:block">
      <div className="p-4">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Navigation
        </p>
        <DashboardSidebarNav role={role} />
      </div>
    </aside>
  );
}