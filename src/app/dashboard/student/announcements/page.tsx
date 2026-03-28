import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasRole, ROLES } from "@/lib/rbac";
import DashboardTopbar from "@/components/layout/dashboard-topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, CalendarDays, Megaphone, Newspaper, Pin } from "lucide-react";

const announcements = [
  {
    id: "1",
    title: "Attendance reminder for students",
    excerpt:
      "Students are encouraged to arrive early and check daily attendance updates regularly through the portal.",
    category: "Attendance",
    isPinned: true,
    publishedAt: "2026-03-28",
  },
  {
    id: "2",
    title: "Quarterly school activity notice",
    excerpt:
      "Please wait for adviser instructions regarding participation in the upcoming school activity.",
    category: "Event",
    isPinned: false,
    publishedAt: "2026-03-27",
  },
  {
    id: "3",
    title: "Academic consultation update",
    excerpt:
      "Students should review class adviser announcements for consultation schedules and requirements.",
    category: "Academic",
    isPinned: false,
    publishedAt: "2026-03-26",
  },
];

function getCategoryClass(category: string) {
  switch (category) {
    case "Attendance":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Academic":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "Event":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export default async function StudentAnnouncementsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasRole(session.user.role, [ROLES.STUDENT])) {
    redirect("/unauthorized");
  }

  const displayName = session.user.name ?? session.user.email ?? "Student";
  const pinnedCount = announcements.filter((item) => item.isPinned).length;

  return (
    <div className="portal-shell space-y-6">
      <DashboardTopbar
        title="Student Announcements"
        subtitle="Review school notices, reminders, and student updates."
        userName={displayName}
      />

      <section className="portal-card overflow-hidden border-0 p-0">
        <div className="portal-hero relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_28%)]" />
          <div className="relative grid gap-6 px-6 py-8 text-white md:px-8 md:py-10 xl:grid-cols-[1.45fr_0.95fr]">
            <div className="space-y-4">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                Student Noticeboard
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Stay updated with student notices
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-blue-50/90 md:text-base">
                  Review attendance reminders, academic notices, and school event
                  updates prepared for students.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <Bell className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Total Notices
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{announcements.length}</div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <Pin className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Pinned
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{pinnedCount}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <div className="grid gap-5">
          {announcements.map((announcement) => (
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
          ))}
        </div>

        <div className="grid gap-6">
          <Card className="portal-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-semibold text-slate-900">
                Student Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="portal-card-soft p-4">
                <div className="portal-chip">Attendance</div>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  Review school reminders and attendance-related notices regularly.
                </p>
              </div>

              <div className="portal-card-soft p-4">
                <div className="portal-chip">School Updates</div>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  Watch academic and event-related announcements from your school.
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
                  Notices
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {announcements.length}
                </div>
              </div>

              <div className="portal-card-soft p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Latest Date
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {announcements[0]?.publishedAt ?? "-"}
                </div>
              </div>

              <div className="portal-card-soft p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                  <Newspaper className="h-3.5 w-3.5" />
                  Noticeboard
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  Active
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}