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
  Shield,
  CheckCircle2,
  FileText,
  Archive,
} from "lucide-react";
import CreateAnnouncementDialog from "./create-dialog";
import AnnouncementRowActions from "./row-actions";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildQuery(params: {
  q?: string;
  target?: string;
  status?: string;
  sort?: string;
  page?: number | string;
}) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.target) sp.set("target", params.target);
  if (params.status) sp.set("status", params.status);
  if (params.sort) sp.set("sort", params.sort);
  if (params.page) sp.set("page", String(params.page));
  return `/dashboard/admin/announcements?${sp.toString()}`;
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

function getTargetBadge(target: string) {
  switch (target) {
    case "ALL":
      return {
        label: "Everyone",
        icon: Globe,
        cls: "border-blue-200 bg-blue-50 text-blue-700",
      };
    case "TEACHER":
      return {
        label: "Teachers",
        icon: Users,
        cls: "border-emerald-200 bg-emerald-50 text-emerald-700",
      };
    case "STUDENT":
      return {
        label: "Students",
        icon: GraduationCap,
        cls: "border-violet-200 bg-violet-50 text-violet-700",
      };
    case "ADMIN":
      return {
        label: "Admins",
        icon: Shield,
        cls: "border-amber-200 bg-amber-50 text-amber-700",
      };
    default:
      return {
        label: target,
        icon: Globe,
        cls: "border-slate-200 bg-slate-50 text-slate-700",
      };
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "PUBLISHED":
      return {
        label: "Published",
        icon: CheckCircle2,
        cls: "border-green-200 bg-green-50 text-green-700",
      };
    case "DRAFT":
      return {
        label: "Draft",
        icon: FileText,
        cls: "border-slate-200 bg-slate-50 text-slate-600",
      };
    case "ARCHIVED":
      return {
        label: "Archived",
        icon: Archive,
        cls: "border-orange-200 bg-orange-50 text-orange-700",
      };
    default:
      return {
        label: status,
        icon: FileText,
        cls: "border-slate-200 bg-slate-50 text-slate-600",
      };
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminAnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    target?: string;
    status?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasRole(session.user.role, [ROLES.SUPER_ADMIN, ROLES.ADMIN]))
    redirect("/unauthorized");

  const params = await searchParams;

  const q = params.q?.trim() ?? "";
  const target = params.target?.trim() ?? "";
  const status = params.status?.trim() ?? "";
  const sort = params.sort?.trim() ?? "newest";
  const page = Math.max(Number(params.page || "1"), 1);

  // ── Build Prisma where ────────────────────────────────────────────────────

  const where = {
    AND: [
      target
        ? { target: target as "ALL" | "TEACHER" | "STUDENT" | "ADMIN" }
        : {},
      status
        ? { status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED" }
        : {},
      q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" as const } },
              { content: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {},
    ],
  };

  // ── Sorting ───────────────────────────────────────────────────────────────

  const orderBy =
    sort === "oldest"
      ? [{ isPinned: "desc" as const }, { createdAt: "asc" as const }]
      : sort === "title_asc"
        ? [{ isPinned: "desc" as const }, { title: "asc" as const }]
        : sort === "title_desc"
          ? [{ isPinned: "desc" as const }, { title: "desc" as const }]
          : // default: newest
            [{ isPinned: "desc" as const }, { createdAt: "desc" as const }];

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const [totalCount, announcements, summaryAll] = await Promise.all([
    prisma.announcement.count({ where }),
    prisma.announcement.findMany({
      where,
      include: {
        author: { select: { name: true, email: true } },
        _count: { select: { reads: true } },
      },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    // summary counts (unfiltered)
    prisma.announcement.findMany({
      select: { status: true, target: true, isPinned: true },
    }),
  ]);

  const totalPages = Math.max(Math.ceil(totalCount / PAGE_SIZE), 1);

  // ── Summary stats ─────────────────────────────────────────────────────────

  const publishedCount = summaryAll.filter((a) => a.status === "PUBLISHED").length;
  const draftCount = summaryAll.filter((a) => a.status === "DRAFT").length;
  const pinnedCount = summaryAll.filter((a) => a.isPinned).length;

  const displayName = session.user.name ?? session.user.email ?? "Admin";

  return (
    <div className="portal-shell space-y-6">
      <DashboardTopbar
        title="Announcements"
        subtitle="Create and manage school announcements for all user roles."
        userName={displayName}
      />

      {/* ── Hero section ─────────────────────────────────────────────────── */}
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
                  Broadcast notices to teachers, students, and staff
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-blue-50/90 md:text-base">
                  Create, edit, pin, and manage announcements with targeted
                  delivery by role.
                </p>
              </div>

              {/* Create button in hero */}
              <div>
                <CreateAnnouncementDialog />
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <Bell className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Total
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{summaryAll.length}</div>
              </div>

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
            </div>
          </div>
        </div>
      </section>

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <Card className="portal-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold text-slate-900">
            Search &amp; Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {/* Search */}
            <div className="relative xl:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search by title or content…"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm shadow-sm outline-none transition focus:border-blue-300"
              />
            </div>

            {/* Target */}
            <select
              name="target"
              defaultValue={target}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-blue-300"
            >
              <option value="">All targets</option>
              <option value="ALL">Everyone</option>
              <option value="TEACHER">Teachers</option>
              <option value="STUDENT">Students</option>
              <option value="ADMIN">Admins</option>
            </select>

            {/* Status */}
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

            {/* Sort */}
            <select
              name="sort"
              defaultValue={sort}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-blue-300"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="title_asc">Title A → Z</option>
              <option value="title_desc">Title Z → A</option>
            </select>

            {/* Actions */}
            <div className="flex gap-2 md:col-span-2 xl:col-span-5">
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

      {/* ── Announcement list ─────────────────────────────────────────────── */}
      <Card className="portal-card">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-xl font-semibold text-slate-900">
              Announcement Records
            </CardTitle>
            <span className="text-sm text-slate-500">
              {totalCount} result{totalCount !== 1 ? "s" : ""}
              {q && (
                <span className="ml-1">
                  for &ldquo;<span className="font-medium text-slate-700">{q}</span>&rdquo;
                </span>
              )}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {announcements.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 text-center">
              <Bell className="mb-3 h-10 w-10 text-slate-300" />
              <p className="text-base font-semibold text-slate-800">
                No announcements found
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {q
                  ? "Try a different search term or clear your filters."
                  : "Create the first announcement using the button above."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((a) => {
                const targetBadge = getTargetBadge(a.target);
                const statusBadge = getStatusBadge(a.status);
                const TargetIcon = targetBadge.icon;
                const StatusIcon = statusBadge.icon;

                return (
                  <div
                    key={a.id}
                    className={`relative overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
                      a.isPinned
                        ? "border-blue-200 ring-1 ring-blue-100"
                        : "border-slate-200"
                    }`}
                  >
                    {a.isPinned && (
                      <div className="absolute right-0 top-0 rounded-bl-2xl bg-blue-600 px-3 py-1">
                        <Pin className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}

                    <div className="p-5">
                      {/* Top row: badges + date */}
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        {/* Status */}
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${statusBadge.cls}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusBadge.label}
                        </span>

                        {/* Target */}
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${targetBadge.cls}`}
                        >
                          <TargetIcon className="h-3 w-3" />
                          {targetBadge.label}
                        </span>

                        <span className="ml-auto text-xs text-slate-400">
                          {formatDateTime(a.createdAt)}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-semibold leading-snug text-slate-900">
                        {a.title}
                      </h3>

                      {/* Content preview */}
                      <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-slate-600">
                        {a.content}
                      </p>

                      {/* Bottom row: author + reads + actions */}
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>
                            By{" "}
                            <span className="font-medium text-slate-700">
                              {a.author?.name ?? a.author?.email ?? "Unknown"}
                            </span>
                          </span>
                          <span>{a._count.reads} read{a._count.reads !== 1 ? "s" : ""}</span>
                          {a.updatedAt > a.createdAt && (
                            <span>
                              Edited {formatDateTime(a.updatedAt)}
                            </span>
                          )}
                        </div>

                        {/* Row actions */}
                        <AnnouncementRowActions
                          announcement={{
                            id: a.id,
                            title: a.title,
                            content: a.content,
                            target: a.target,
                            status: a.status,
                            isPinned: a.isPinned,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Pagination ────────────────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="text-slate-600">
                Page {page} of {totalPages} &bull; {totalCount} total
              </span>

              <div className="flex items-center gap-2">
                <a
                  href={buildQuery({ q, target, status, sort, page: Math.max(page - 1, 1) })}
                  className={`inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 font-medium text-slate-700 ${
                    page <= 1 ? "pointer-events-none opacity-40" : ""
                  }`}
                >
                  Previous
                </a>

                {/* Page numbers (compact) */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNum =
                      totalPages <= 5
                        ? i + 1
                        : page <= 3
                          ? i + 1
                          : page >= totalPages - 2
                            ? totalPages - 4 + i
                            : page - 2 + i;

                    if (pageNum < 1 || pageNum > totalPages) return null;

                    return (
                      <a
                        key={pageNum}
                        href={buildQuery({ q, target, status, sort, page: pageNum })}
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border font-medium text-sm ${
                          pageNum === page
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-slate-200 bg-white text-slate-700"
                        }`}
                      >
                        {pageNum}
                      </a>
                    );
                  })}
                </div>

                <a
                  href={buildQuery({ q, target, status, sort, page: Math.min(page + 1, totalPages) })}
                  className={`inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 font-medium text-slate-700 ${
                    page >= totalPages ? "pointer-events-none opacity-40" : ""
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
