import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasRole, ROLES } from "@/lib/rbac";
import DashboardTopbar from "@/components/layout/dashboard-topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Search, Filter, Pin, Megaphone } from "lucide-react";
import { getAnnouncementsForRole } from "../../announcements/shared-actions";
import AnnouncementCardList from "../../announcements/announcement-card-list";

const PAGE_SIZE = 8;

function buildQuery(params: { q?: string; page?: number | string }) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.page) sp.set("page", String(params.page));
  return `/dashboard/teacher/announcements?${sp.toString()}`;
}

export default async function TeacherAnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (
    !hasRole(session.user.role, [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.TEACHER,
    ])
  ) {
    redirect("/unauthorized");
  }

  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const page = Math.max(Number(params.page || "1"), 1);

  const { announcements, totalCount, totalPages, unreadCount } =
    await getAnnouncementsForRole({
      q,
      page,
      pageSize: PAGE_SIZE,
      userId: session.user.id,
      role: "TEACHER",
    });

  const displayName = session.user.name ?? session.user.email ?? "Teacher";

  return (
    <div className="portal-shell space-y-6">
      <DashboardTopbar
        title="Announcements"
        subtitle="Stay updated with school notices and teacher reminders."
        userName={displayName}
      />

      {/* Hero */}
      <section className="portal-card overflow-hidden border-0 p-0">
        <div className="portal-hero relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_28%)]" />
          <div className="relative grid gap-6 px-6 py-8 md:px-8 md:py-10 xl:grid-cols-[1.45fr_0.95fr]">
            <div className="space-y-4 text-white">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                Teacher Noticeboard
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  School announcements and teacher notices
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-blue-50/90 md:text-base">
                  Read attendance reminders, academic schedules, and important
                  school updates in one place.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <Bell className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Total Notices
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{totalCount}</div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <Megaphone className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Unread
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{unreadCount}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search */}
      <Card className="portal-card">
        <CardContent className="pt-4">
          <form className="flex gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search announcements..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm shadow-sm outline-none transition focus:border-blue-300"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-11 items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              <Filter className="mr-2 h-4 w-4" />
              Search
            </button>
            {q && (
              <a
                href="/dashboard/teacher/announcements"
                className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700"
              >
                Clear
              </a>
            )}
          </form>
        </CardContent>
      </Card>

      {/* List */}
      <Card className="portal-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
            <Bell className="h-5 w-5 text-slate-700" />
            All Announcements
            {unreadCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <AnnouncementCardList
            announcements={announcements}
            unreadCount={unreadCount}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="text-slate-600">
                Page {page} of {totalPages} &bull; {totalCount} total
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={buildQuery({ q, page: Math.max(page - 1, 1) })}
                  className={`inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 font-medium text-slate-700 ${
                    page <= 1 ? "pointer-events-none opacity-50" : ""
                  }`}
                >
                  Previous
                </a>
                <a
                  href={buildQuery({ q, page: Math.min(page + 1, totalPages) })}
                  className={`inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 font-medium text-slate-700 ${
                    page >= totalPages ? "pointer-events-none opacity-50" : ""
                  }`}
                >
                  Next
                </a>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
