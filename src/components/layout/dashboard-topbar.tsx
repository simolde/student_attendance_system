import { Bell, Search, UserCircle2 } from "lucide-react";

export default function DashboardTopbar({
  title = "Dashboard",
  subtitle = "Manage school attendance and daily records.",
  userName,
}: {
  title?: string;
  subtitle?: string;
  userName?: string | null;
}) {
  return (
    <div className="portal-card flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>
        <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden min-w-[260px] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm lg:flex">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          <Bell className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <UserCircle2 className="h-8 w-8 text-slate-500" />
          <div className="hidden sm:block">
            <div className="text-sm font-semibold text-slate-900">
              {userName ?? "User"}
            </div>
            <div className="text-xs text-slate-500">School Portal</div>
          </div>
        </div>
      </div>
    </div>
  );
}