import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import TableToolbar from "@/components/layout/table-toolbar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAGE_SIZE = 15;

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; action?: string; page?: string }>;
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
  const action = params.action?.trim() ?? "";
  const page = Math.max(Number(params.page || "1"), 1);

  const where = {
    AND: [
      q
        ? {
            OR: [
              { action: { contains: q, mode: "insensitive" as const } },
              { entity: { contains: q, mode: "insensitive" as const } },
              { description: { contains: q, mode: "insensitive" as const } },
              { user: { name: { contains: q, mode: "insensitive" as const } } },
              { user: { email: { contains: q, mode: "insensitive" as const } } },
            ],
          }
        : {},
      action
        ? {
            action: {
              equals: action,
            },
          }
        : {},
    ],
  };

  const [logs, totalLogs, actionOptions] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      distinct: ["action"],
      select: {
        action: true,
      },
      orderBy: {
        action: "asc",
      },
    }),
  ]);

  const totalPages = Math.max(Math.ceil(totalLogs / PAGE_SIZE), 1);

  function buildUrl(nextPage: number) {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (action) sp.set("action", action);
    sp.set("page", String(nextPage));
    return `/dashboard/admin/audit-logs?${sp.toString()}`;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Audit Logs"
        description="Review tracked actions across users, account updates, and system activity."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin", href: "/dashboard/admin" },
          { label: "Audit Logs" },
        ]}
      />

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle>System Activity</CardTitle>
          <CardDescription>
            Page {page} of {totalPages} • {totalLogs} total log entries
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <TableToolbar>
            <form method="GET" className="grid flex-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium">Search</label>
                <Input
                  name="q"
                  defaultValue={q}
                  placeholder="Search action, entity, description, or user"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Action</label>
                <select
                  name="action"
                  defaultValue={action}
                  className="h-11 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">All actions</option>
                  {actionOptions.map((item) => (
                    <option key={item.action} value={item.action}>
                      {item.action}
                    </option>
                  ))}
                </select>
              </div>

              <input type="hidden" name="page" value="1" />

              <div className="flex items-end gap-2">
                <Button type="submit">Apply</Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/dashboard/admin/audit-logs">Reset</Link>
                </Button>
              </div>
            </form>
          </TableToolbar>

          {logs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              No audit logs found.
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80">
                      <TableHead>When</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id} className="align-top">
                        <TableCell className="whitespace-nowrap text-sm text-slate-600">
                          {formatDate(log.createdAt)}
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-slate-900">
                              {log.user?.name ?? "-"}
                            </p>
                            <p className="text-sm text-slate-500">
                              {log.user?.email ?? "-"}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell className="font-medium text-slate-900">
                          {log.action}
                        </TableCell>

                        <TableCell className="text-slate-700">
                          {log.entity}
                        </TableCell>

                        <TableCell className="max-w-[420px] text-sm text-slate-600">
                          {log.description ?? "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between">
                <Button variant="outline" asChild disabled={page <= 1}>
                  <Link href={buildUrl(page - 1)}>Previous</Link>
                </Button>

                <span className="text-sm text-slate-500">
                  Page {page} of {totalPages}
                </span>

                <Button variant="outline" asChild disabled={page >= totalPages}>
                  <Link href={buildUrl(page + 1)}>Next</Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}