import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import DashboardTopbar from "@/components/layout/dashboard-topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShieldCheck,
  Search,
  Filter,
  FileText,
  UserCircle2,
  Activity,
} from "lucide-react";

const PAGE_SIZE = 15;

function buildAuditLogsQuery(params: {
  q?: string;
  entity?: string;
  page?: string | number;
}) {
  const search = new URLSearchParams();

  if (params.q) search.set("q", params.q);
  if (params.entity) search.set("entity", params.entity);
  if (params.page) search.set("page", String(params.page));

  return `/dashboard/admin/audit-logs?${search.toString()}`;
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(value);
}

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    entity?: string;
    page?: string;
  }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasRole(session.user.role, [ROLES.SUPER_ADMIN, ROLES.ADMIN])) {
    redirect("/unauthorized");
  }

  const params = await searchParams;

  const q = params.q?.trim() ?? "";
  const entity = params.entity?.trim() ?? "";
  const page = Math.max(Number(params.page || "1"), 1);

  const where = {
    AND: [
      entity ? { entity } : {},
      q
        ? {
            OR: [
              { action: { contains: q, mode: "insensitive" as const } },
              { entity: { contains: q, mode: "insensitive" as const } },
              { entityId: { contains: q, mode: "insensitive" as const } },
              { description: { contains: q, mode: "insensitive" as const } },
              {
                user: {
                  name: { contains: q, mode: "insensitive" as const },
                },
              },
              {
                user: {
                  email: { contains: q, mode: "insensitive" as const },
                },
              },
            ],
          }
        : {},
    ],
  };

  const [totalCount, logs, entities, summaryRows] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.findMany({
      distinct: ["entity"],
      select: {
        entity: true,
      },
      orderBy: {
        entity: "asc",
      },
    }),
    prisma.auditLog.findMany({
      select: {
        id: true,
      },
    }),
  ]);

  const totalPages = Math.max(Math.ceil(totalCount / PAGE_SIZE), 1);

  return (
    <div className="portal-shell space-y-6">
      <DashboardTopbar
        title="Audit Logs"
        subtitle="Review activity history, tracked actions, and system accountability records."
        userName={session.user.name ?? session.user.email}
      />

      <section className="portal-card overflow-hidden border-0 p-0">
        <div className="portal-hero relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_28%)]" />
          <div className="relative grid gap-6 px-6 py-8 md:px-8 md:py-10 xl:grid-cols-[1.45fr_0.95fr]">
            <div className="space-y-4 text-white">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                System Accountability
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Review audit trail and tracked activity
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-blue-50/90 md:text-base">
                  Monitor updates across attendance, users, imports, and other
                  system entities from one security-focused page.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <FileText className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Total Logs
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{summaryRows.length}</div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Entities
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{entities.length}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Card className="portal-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold text-slate-900">
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-[1fr_220px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search action, entity, user, description"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm shadow-sm outline-none transition focus:border-blue-300"
              />
            </div>

            <select
              name="entity"
              defaultValue={entity}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-blue-300"
            >
              <option value="">All entities</option>
              {entities.map((item) => (
                <option key={item.entity} value={item.entity}>
                  {item.entity}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <button
                type="submit"
                className="inline-flex h-11 items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                <Filter className="mr-2 h-4 w-4" />
                Apply
              </button>

              <a
                href="/dashboard/admin/audit-logs"
                className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700"
              >
                Reset
              </a>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="portal-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold text-slate-900">
            Audit Log Records
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Date & Time</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">User</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Action</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Entity</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Entity ID</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-sm text-muted-foreground"
                      >
                        No audit logs found.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="border-t border-slate-100">
                        <td className="px-4 py-4 text-slate-700">
                          {formatDateTime(log.createdAt)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 font-medium text-slate-900">
                              <UserCircle2 className="h-4 w-4 text-slate-400" />
                              <span>{log.user?.name ?? "-"}</span>
                            </div>
                            <div className="text-xs text-slate-500">
                              {log.user?.email ?? "System"}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {log.entity}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {log.entityId ?? "-"}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-start gap-2 text-slate-700">
                            <Activity className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                            <span>{log.description ?? "-"}</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="text-slate-600">
              Page {page} of {totalPages} • Total {totalCount}
            </div>

            <div className="flex items-center gap-2">
              <a
                href={buildAuditLogsQuery({
                  q,
                  entity,
                  page: Math.max(page - 1, 1),
                })}
                className={`inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 font-medium text-slate-700 ${
                  page <= 1 ? "pointer-events-none opacity-50" : ""
                }`}
              >
                Previous
              </a>

              <a
                href={buildAuditLogsQuery({
                  q,
                  entity,
                  page: Math.min(page + 1, totalPages),
                })}
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