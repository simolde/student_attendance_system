import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasRole, ROLES } from "@/lib/rbac";
import DashboardTopbar from "@/components/layout/dashboard-topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bell,
  Search,
  Filter,
  Pin,
  Megaphone,
  Archive,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { getAnnouncements } from "./actions";
import CreateAnnouncementDialog from "./create-announcement-dialog";
import AnnouncementRowActions from "./announcement-row-actions";

const PAGE_SIZE = 10;

function buildQuery(params: {
  q?: string;
  target?: string;
  status?: string;
  page?: number | string;
}) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.target) sp.set("target", params.target);
  if (params.status) sp.set("status", params.status);
  if (params.page) sp.set("page", String(params.page));
  return `/dashboard/admin/announcements?${sp.toString()}`;
}

function getTargetBadgeClass(target: string) {
  switch (target) {
    case "ALL":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "TEACHER":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "STUDENT":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "ADMIN":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "PUBLISHED":
      return "border-green-200 bg-green-50 text-green-700";
    case "DRAFT":
      return "border-slate-200 bg-slate-50 text-slate-700";
    case "ARCHIVED":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
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

export default async function AdminAnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    target?: string;
    status?: string;
    page?: string;
  }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasRole(session.user.role, [ROLES.SUPER_ADMIN, ROLES.ADMIN])) {
    redirect("/unauthorized");
  }

  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const target = params.target?.trim() ?? "";
  const status = params.status?.trim() ?? "";
  const page = Math.max(Number(params.page || "1"), 1);

  const { announcements, totalCount, totalPages } = await getAnnouncements({
    q,
    target,
    status,
    page,
    pageSize: PAGE_SIZE,
  });

  // Summary counts (across all, not just current filter)
  const [publishedCount, draftCount, pinnedCount] = await Promise.all([
    import("@/lib/prisma").then(({ prisma }) =>
      prisma.announcement.count({ where: { status: "PUBLISHED" } })
    ),
    import("@/lib/prisma").then(({ prisma }) =>
      prisma.announcement.count({ where: { status: "DRAFT" } })
    ),
    import("@/lib/prisma").then(({ prisma }) =>
      prisma.announcement.count({ where: { isPinned: true } })
    ),
  ]);

  return (
    <div className="portal-shell space-y-6">
      <DashboardTopbar
        title="Announcements"
        subtitle="Create, manage, and publish school announcements across roles."
        userName={session.user.name ?? session.user.email}
      />

      {/* Hero */}
      <section className="portal-card overflow-hidden border-0 p-0">
        <div className="portal-hero relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_28%)]" />
          <div className="relative grid gap-6 px-6 py-8 md:px-8 md:py-10 xl:grid-cols-[1.45fr_0.95fr]">
            <div className="space-y-4 text-white">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                Announcement Management
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Manage school announcements and notices
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-blue-50/90 md:text-base">
                  Publish targeted announcements for admins, teachers, students,
                  or everyone. Pin important notices to keep them visible.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Published
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{publishedCount}</div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <FileText className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Drafts
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{draftCount}</div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <Pin className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Pinned
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{pinnedCount}</div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <Megaphone className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Total
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{totalCount}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <Card className="portal-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold text-slate-900">
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {/* Search */}
            <div className="relative xl:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search title or content..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm shadow-sm outline-none transition focus:border-blue-300"
              />
            </div>

            <select
              name="target"
              defaultValue={target}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-blue-300"
            >
              <option value="">All audiences</option>
              <option value="ALL">All Users</option>
              <option value="ADMIN">Admin</option>
              <option value="TEACHER">Teacher</option>
              <option value="STUDENT">Student</option>
            </select>

            <select
              name="status"
              defaultValue={status}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-blue-300"
            >
              <option value="">All statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>

            <div className="flex gap-2 md:col-span-2 xl:col-span-4">
              <button
                type="submit"
                className="inline-flex h-11 items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                <Filter className="mr-2 h-4 w-4" />
                Apply Filters
              </button>
              <a
                href="/dashboard/admin/announcements"
                className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700"
              >
                Reset
              </a>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="portal-card">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-xl font-semibold text-slate-900">
            Announcement Records
          </CardTitle>
          <CreateAnnouncementDialog />
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="px-4 py-3 text-left font-medium text-slate-700">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">
                      Audience
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">
                      Reads
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">
                      Author
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">
                      Published
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {announcements.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-12 text-center text-sm text-muted-foreground"
                      >
                        <div className="space-y-2">
                          <Bell className="mx-auto h-8 w-8 text-slate-300" />
                          <p className="font-medium text-slate-500">
                            No announcements found
                          </p>
                          <p className="text-xs text-slate-400">
                            Try adjusting your filters or create a new one.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    announcements.map((ann) => (
                      <tr key={ann.id} className="border-t border-slate-100">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            {ann.isPinned && (
                              <Pin className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                            )}
                            <div>
                              <p className="font-medium text-slate-900 line-clamp-1 max-w-xs">
                                {ann.title}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-500 line-clamp-1 max-w-xs">
                                {ann.content}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          {ann.targets.map((t) => (
                            <span
                              key={t}
                              className={`inline-flex mr-1 rounded-full border px-2.5 py-1 text-xs font-medium ${getTargetBadgeClass(t)}`}
                            >
                              {t}
                            </span>
                          ))}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(
                              ann.status
                            )}`}
                          >
                            {ann.status}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {ann._count.reads}
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {ann.author?.name ?? ann.author?.email ?? "-"}
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {formatDateTime(ann.createdAt)}
                        </td>

                        <td className="px-4 py-4">
                          <AnnouncementRowActions announcement={ann} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="text-slate-600">
              Page {page} of {totalPages} &bull; {totalCount} total
              {q && (
                <span className="ml-2 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 border border-blue-200">
                  Search: {q}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <a
                href={buildQuery({ q, target, status, page: Math.max(page - 1, 1) })}
                className={`inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 font-medium text-slate-700 ${
                  page <= 1 ? "pointer-events-none opacity-50" : ""
                }`}
              >
                Previous
              </a>

              {/* Page numbers (show up to 5) */}
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum =
                  totalPages <= 5
                    ? i + 1
                    : page <= 3
                      ? i + 1
                      : page >= totalPages - 2
                        ? totalPages - 4 + i
                        : page - 2 + i;
                return (
                  <a
                    key={pageNum}
                    href={buildQuery({ q, target, status, page: pageNum })}
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-medium transition ${
                      pageNum === page
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {pageNum}
                  </a>
                );
              })}

              <a
                href={buildQuery({ q, target, status, page: Math.min(page + 1, totalPages) })}
                className={`inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 font-medium text-slate-700 ${
                  page >= totalPages ? "pointer-events-none opacity-50" : ""
                }`}
              >
                Next
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
