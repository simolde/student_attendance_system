import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasRole, ROLES } from "@/lib/rbac";
import DashboardTopbar from "@/components/layout/dashboard-topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bell,
  CalendarDays,
  Megaphone,
  Pin,
  Search,
  Newspaper,
} from "lucide-react";

type Announcement = {
  id: string;
  title: string;
  excerpt: string;
  category: "General" | "Academic" | "Attendance" | "Event";
  isPinned?: boolean;
  publishedAt: string;
};

const announcements: Announcement[] = [
  {
    id: "1",
    title: "Attendance submission reminder",
    excerpt:
      "Teachers are reminded to review and finalize daily attendance records before the end of the school day.",
    category: "Attendance",
    isPinned: true,
    publishedAt: "2026-03-28",
  },
  {
    id: "2",
    title: "Quarterly academic consultation schedule",
    excerpt:
      "Parents and guardians may review the consultation schedule through the school office and assigned advisers.",
    category: "Academic",
    publishedAt: "2026-03-27",
  },
  {
    id: "3",
    title: "Campus activity and student participation",
    excerpt:
      "Selected students will participate in the upcoming school activity program this week. Further details will be shared by advisers.",
    category: "Event",
    publishedAt: "2026-03-26",
  },
  {
    id: "4",
    title: "General system portal update",
    excerpt:
      "The student attendance portal has been updated for a cleaner desktop experience and improved navigation.",
    category: "General",
    publishedAt: "2026-03-25",
  },
];

function getCategoryClass(category: Announcement["category"]) {
  switch (category) {
    case "Attendance":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Academic":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "Event":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "General":
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (
    !hasRole(session.user.role, [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.TEACHER,
      ROLES.STAFF,
      ROLES.STUDENT,
    ])
  ) {
    redirect("/unauthorized");
  }

  const params = await searchParams;
  const q = params.q?.trim().toLowerCase() ?? "";

  const filteredAnnouncements = announcements.filter((item) => {
    if (!q) return true;

    return (
      item.title.toLowerCase().includes(q) ||
      item.excerpt.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  const pinnedCount = filteredAnnouncements.filter((item) => item.isPinned).length;

  return (
    <div className="portal-shell space-y-6">
      <DashboardTopbar
        title="Announcements"
        subtitle="Stay updated with school notices, attendance reminders, and academic updates."
        userName={session.user.name ?? session.user.email}
      />

      <section className="portal-card overflow-hidden border-0 p-0">
        <div className="portal-hero relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_28%)]" />
          <div className="relative grid gap-6 px-6 py-8 md:px-8 md:py-10 xl:grid-cols-[1.45fr_0.95fr]">
            <div className="space-y-4 text-white">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                School Noticeboard
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Important school announcements in one place
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-blue-50/90 md:text-base">
                  Review important reminders, academic notices, attendance updates,
                  and school activities through a cleaner desktop portal layout.
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
                <div className="mt-2 text-lg font-semibold">
                  {filteredAnnouncements.length}
                </div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <Pin className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Pinned Notices
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{pinnedCount}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Card className="portal-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold text-slate-900">
            Search Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search title, category, or keyword"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm shadow-sm outline-none transition focus:border-blue-300"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="inline-flex h-11 items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                Search
              </button>

              <a
                href="/dashboard/announcements"
                className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700"
              >
                Reset
              </a>
            </div>
          </form>
        </CardContent>
      </Card>

      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <div className="grid gap-5">
          {filteredAnnouncements.length === 0 ? (
            <Card className="portal-card">
              <CardContent className="flex min-h-55 items-center justify-center p-8 text-center">
                <div className="space-y-2">
                  <p className="text-base font-semibold text-slate-900">
                    No announcements found
                  </p>
                  <p className="text-sm text-slate-600">
                    Try another keyword or reset the search filters.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredAnnouncements.map((announcement) => (
              <Card key={announcement.id} className="portal-card">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getCategoryClass(
                            announcement.category
                          )}`}
                        >
                          {announcement.category}
                        </span>

                        {announcement.isPinned ? (
                          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                            <Pin className="mr-1 h-3.5 w-3.5" />
                            Pinned
                          </span>
                        ) : null}
                      </div>

                      <div>
                        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                          {announcement.title}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {announcement.excerpt}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-sm text-slate-500">
                      {announcement.publishedAt}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="grid gap-6">
          <Card className="portal-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-semibold text-slate-900">
                Announcement Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="portal-card-soft p-4">
                <div className="portal-chip">Attendance</div>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  Review attendance-related notices before updating class records.
                </p>
              </div>

              <div className="portal-card-soft p-4">
                <div className="portal-chip">Academic</div>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  Check school schedules, consultations, and academic reminders.
                </p>
              </div>

              <div className="portal-card-soft p-4">
                <div className="portal-chip">Events</div>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  Stay informed about student activities and school programs.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="portal-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-semibold text-slate-900">
                Quick Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 pt-0">
              <div className="portal-card-soft p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                  <Megaphone className="h-3.5 w-3.5" />
                  Published Notices
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {filteredAnnouncements.length}
                </div>
              </div>

              <div className="portal-card-soft p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Latest Date
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {filteredAnnouncements[0]?.publishedAt ?? "-"}
                </div>
              </div>

              <div className="portal-card-soft p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                  <Newspaper className="h-3.5 w-3.5" />
                  Portal Status
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  Active Noticeboard
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}