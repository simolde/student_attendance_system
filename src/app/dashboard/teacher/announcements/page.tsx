import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import DashboardTopbar from "@/components/layout/dashboard-topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bell,
  Pin,
  Search,
  Filter,
  Globe,
  GraduationCap,
  Users,
  CheckCircle2,
} from "lucide-react";
import AnnouncementReadButton from "@/components/announcements/announcement-read-button";

const PAGE_SIZE = 8;

function buildQuery(params: {
  q?: string;
  sort?: string;
  page?: number | string;
}) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.sort) sp.set("sort", params.sort);
  if (params.page) sp.set("page", String(params.page));
  return `/dashboard/teacher/announcements?${sp.toString()}`;
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export default async function TeacherAnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasRole(session.user.role, [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER]))
    redirect("/unauthorized");

  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const sort = params.sort?.trim() ?? "newest";
  const page = Math.max(Number(params.page || "1"), 1);

  const where = {
    status: "PUBLISHED" as const,
    target: { in: ["ALL", "TEACHER"] as const },
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { content: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const orderBy =
    sort === "oldest"
      ? [{ isPinned: "desc" as const }, { createdAt: "asc" as const }]
      : [{ isPinned: "desc" as const }, { createdAt: "desc" as const }];

  const [totalCount, announcements] = await Promise.all([
    prisma.announcement.count({ where }),
    prisma.announcement.findMany({
      where,
      include: {
        author: { select: { name: true } },
        reads: {
          where: { userId: session.user.id },
          select: { id: true },
        },
      },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(Math.ceil(totalCount / PAGE_SIZE), 1);
  const unreadCount = announcements.filter((a) => a.reads.length === 0).length;
  const pinnedCount = announcements.filter((a) => a.isPinned).length;

  const displayName = session.user.name ?? session.user.email ?? "Teacher";

  return (
    <div className="portal-shell space-y-6">
      <DashboardTopbar
        title="Announcements"
        subtitle="Stay updated with school and classroom notices."
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
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  School notices and reminders for teachers
                </h1>
                <p className="text-sm leading-6 text-blue-50/90">
                  Attendance submission deadlines, school events, and academic
                  notices prepared for teaching staff.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <Bell className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Total
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{totalCount}</div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Unread
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">
                  {unreadCount}
                  {unreadCount > 0 && (
                    <span className="ml-2 inline-flex h-5 items-center rounded-full bg-amber-400/30 px-2 text-xs font-semibold text-amber-200">
                      New
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur sm:col-span-2">
                <div className="flex items-center gap-2 text-blue-100">
                  <Pin className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Pinned on this page
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{pinnedCount}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search */}
      <Card className="portal-card">
        <CardContent className="pt-5">
          <form className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search announcements…"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm shadow-sm outline-none transition focus:border-blue-300"
              />
            </div>

            <select
              name="sort"
              defaultValue={sort}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-blue-300 md:w-44"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>

            <div className="flex gap-2">
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
            </div>
          </form>
        </CardContent>
      </Card>

      {/* List */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <Card className="portal-card">
            <CardContent className="flex min-h-48 flex-col items-center justify-center text-center">
              <Bell className="mb-3 h-10 w-10 text-slate-300" />
              <p className="text-base font-semibold text-slate-800">
                No announcements found
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {q ? "Try a different search term." : "Check back later for updates."}
              </p>
            </CardContent>
          </Card>
        ) : (
          announcements.map((a) => {
            const isRead = a.reads.length > 0;

            return (
              <div
                key={a.id}
                className={`relative overflow-hidden rounded-2xl border bg-white shadow-sm ${
                  a.isPinned ? "border-blue-200 ring-1 ring-blue-100" : "border-slate-200"
                } ${!isRead ? "ring-1 ring-amber-200" : ""}`}
              >
                {a.isPinned && (
                  <div className="absolute right-0 top-0 rounded-bl-2xl bg-blue-600 px-3 py-1">
                    <Pin className="h-3.5 w-3.5 text-white" />
                  </div>
                )}

                {!isRead && !a.isPinned && (
                  <div className="absolute left-0 top-0 h-full w-1 rounded-l-2xl bg-amber-400" />
                )}

                <div className="p-5">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {/* Target */}
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      {a.target === "ALL" ? (
                        <Globe className="h-3 w-3" />
                      ) : (
                        <Users className="h-3 w-3" />
                      )}
                      {a.target === "ALL" ? "Everyone" : "Teachers"}
                    </span>

                    {!isRead && (
                      <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                        New
                      </span>
                    )}

                    <span className="ml-auto text-xs text-slate-400">
                      {formatDateTime(a.createdAt)}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-slate-900">{a.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{a.content}</p>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      By {a.author?.name ?? "Admin"}
                    </span>

                    {!isRead && (
                      <AnnouncementReadButton announcementId={a.id} />
                    )}

                    {isRead && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Read
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <a
              href={buildQuery({ q, sort, page: Math.max(page - 1, 1) })}
              className={`inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 font-medium text-slate-700 ${
                page <= 1 ? "pointer-events-none opacity-40" : ""
              }`}
            >
              Previous
            </a>
            <a
              href={buildQuery({ q, sort, page: Math.min(page + 1, totalPages) })}
              className={`inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 font-medium text-slate-700 ${
                page >= totalPages ? "pointer-events-none opacity-40" : ""
              }`}
            >
              Next
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
