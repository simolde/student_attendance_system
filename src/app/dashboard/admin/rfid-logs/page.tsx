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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAGE_SIZE = 15;

function formatManilaDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getStatusVariant(status: string) {
  switch (status) {
    case "MATCHED":
      return "default";
    case "UNKNOWN_CARD":
      return "destructive";
    case "DENIED":
      return "secondary";
    case "DUPLICATE_SCAN":
      return "outline";
    default:
      return "secondary";
  }
}

export default async function RfidLogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
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
  const status = params.status?.trim() ?? "";
  const page = Math.max(Number(params.page || "1"), 1);

  const where = {
    AND: [
      q
        ? {
            OR: [
              { rfidUid: { contains: q, mode: "insensitive" as const } },
              { message: { contains: q, mode: "insensitive" as const } },
              { student: { studentNo: { contains: q, mode: "insensitive" as const } } },
              { student: { user: { name: { contains: q, mode: "insensitive" as const } } } },
              { student: { user: { email: { contains: q, mode: "insensitive" as const } } } },
              { device: { deviceCode: { contains: q, mode: "insensitive" as const } } },
              { device: { name: { contains: q, mode: "insensitive" as const } } },
            ],
          }
        : {},
      status
        ? {
            status: status as
              | "MATCHED"
              | "UNKNOWN_CARD"
              | "DUPLICATE_SCAN"
              | "DENIED",
          }
        : {},
    ],
  };

  const [logs, totalLogs] = await Promise.all([
    prisma.rfidLog.findMany({
      where,
      include: {
        student: {
          include: {
            user: true,
          },
        },
        device: true,
      },
      orderBy: {
        scanTime: "desc",
      },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.rfidLog.count({ where }),
  ]);

  const totalPages = Math.max(Math.ceil(totalLogs / PAGE_SIZE), 1);

  function buildUrl(nextPage: number) {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (status) sp.set("status", status);
    sp.set("page", String(nextPage));
    return `/dashboard/admin/rfid-logs?${sp.toString()}`;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="RFID Logs"
        description="Monitor raw RFID scans, matched cards, denied scans, and duplicate taps."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin", href: "/dashboard/admin" },
          { label: "RFID Logs" },
        ]}
      />

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle>Scan Activity</CardTitle>
          <CardDescription>
            Page {page} of {totalPages} • {totalLogs} total scan log entries
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
                  placeholder="RFID, student no, name, email, device"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Status</label>
                <select
                  name="status"
                  defaultValue={status}
                  className="h-11 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">All statuses</option>
                  <option value="MATCHED">MATCHED</option>
                  <option value="UNKNOWN_CARD">UNKNOWN_CARD</option>
                  <option value="DENIED">DENIED</option>
                  <option value="DUPLICATE_SCAN">DUPLICATE_SCAN</option>
                </select>
              </div>

              <input type="hidden" name="page" value="1" />

              <div className="flex items-end gap-2">
                <Button type="submit">Apply</Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/dashboard/admin/rfid-logs">Reset</Link>
                </Button>
              </div>
            </form>
          </TableToolbar>

          {logs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              No RFID logs found.
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80">
                      <TableHead>Scan Time</TableHead>
                      <TableHead>RFID UID</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Message</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id} className="align-top">
                        <TableCell className="whitespace-nowrap text-sm text-slate-600">
                          {formatManilaDateTime(log.scanTime)}
                        </TableCell>

                        <TableCell className="font-medium text-slate-900">
                          {log.rfidUid}
                        </TableCell>

                        <TableCell>
                          {log.student ? (
                            <div className="space-y-1">
                              <p className="font-medium text-slate-900">
                                {log.student.user.name ?? "-"}
                              </p>
                              <p className="text-sm text-slate-500">
                                {log.student.studentNo}
                              </p>
                              <p className="text-xs text-slate-500">
                                {log.student.user.email}
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-500">-</span>
                          )}
                        </TableCell>

                        <TableCell>
                          {log.device ? (
                            <div className="space-y-1">
                              <p className="font-medium text-slate-900">
                                {log.device.name}
                              </p>
                              <p className="text-sm text-slate-500">
                                {log.device.deviceCode ?? "-"}
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-500">-</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <Badge variant={getStatusVariant(log.status) as never}>
                            {log.status}
                          </Badge>
                        </TableCell>

                        <TableCell className="max-w-[320px] text-sm text-slate-600">
                          {log.message ?? "-"}
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