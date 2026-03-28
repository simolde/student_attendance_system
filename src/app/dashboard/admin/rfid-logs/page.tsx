import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import DashboardTopbar from "@/components/layout/dashboard-topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Radio,
  Search,
  Filter,
  UserRoundCheck,
  AlertTriangle,
  Ban,
  CopyCheck,
} from "lucide-react";

const PAGE_SIZE = 15;

function buildRfidLogsQuery(params: {
  q?: string;
  status?: string;
  deviceId?: string;
  page?: string | number;
}) {
  const search = new URLSearchParams();

  if (params.q) search.set("q", params.q);
  if (params.status) search.set("status", params.status);
  if (params.deviceId) search.set("deviceId", params.deviceId);
  if (params.page) search.set("page", String(params.page));

  return `/dashboard/admin/rfid-logs?${search.toString()}`;
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

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "MATCHED":
      return "border-green-200 bg-green-50 text-green-700";
    case "UNKNOWN_CARD":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "DUPLICATE_SCAN":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "DENIED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export default async function RfidLogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    deviceId?: string;
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
  const deviceId = params.deviceId?.trim() ?? "";
  const page = Math.max(Number(params.page || "1"), 1);

  const where = {
    AND: [
      status ? { status: status as "MATCHED" | "UNKNOWN_CARD" | "DUPLICATE_SCAN" | "DENIED" } : {},
      deviceId ? { deviceId } : {},
      q
        ? {
            OR: [
              { rfidUid: { contains: q, mode: "insensitive" as const } },
              { message: { contains: q, mode: "insensitive" as const } },
              {
                student: {
                  studentNo: { contains: q, mode: "insensitive" as const },
                },
              },
              {
                student: {
                  user: {
                    name: { contains: q, mode: "insensitive" as const },
                  },
                },
              },
              {
                device: {
                  name: { contains: q, mode: "insensitive" as const },
                },
              },
            ],
          }
        : {},
    ],
  };

  const [devices, totalCount, logs, summaryRows] = await Promise.all([
    prisma.rfidDevice.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.rfidLog.count({ where }),
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
    prisma.rfidLog.findMany({
      where,
      select: {
        status: true,
      },
    }),
  ]);

  const totalPages = Math.max(Math.ceil(totalCount / PAGE_SIZE), 1);

  const matchedCount = summaryRows.filter((item) => item.status === "MATCHED").length;
  const unknownCount = summaryRows.filter((item) => item.status === "UNKNOWN_CARD").length;
  const duplicateCount = summaryRows.filter((item) => item.status === "DUPLICATE_SCAN").length;
  const deniedCount = summaryRows.filter((item) => item.status === "DENIED").length;

  return (
    <div className="portal-shell space-y-6">
      <DashboardTopbar
        title="RFID Logs"
        subtitle="Review RFID scan activity, matched cards, unknown cards, and denied access."
        userName={session.user.name ?? session.user.email}
      />

      <section className="portal-card overflow-hidden border-0 p-0">
        <div className="portal-hero relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_28%)]" />
          <div className="relative grid gap-6 px-6 py-8 md:px-8 md:py-10 xl:grid-cols-[1.45fr_0.95fr]">
            <div className="space-y-4 text-white">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                RFID Monitoring
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Track RFID scan activity in real time
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-blue-50/90 md:text-base">
                  Review scan logs, detect unknown or duplicate cards, and monitor
                  student matching and device activity from one admin page.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <UserRoundCheck className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Matched
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{matchedCount}</div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Unknown Card
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{unknownCount}</div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <CopyCheck className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Duplicate
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{duplicateCount}</div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <Ban className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Denied
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{deniedCount}</div>
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
          <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="relative xl:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search RFID UID, student, message, or device"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm shadow-sm outline-none transition focus:border-blue-300"
              />
            </div>

            <select
              name="status"
              defaultValue={status}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-blue-300"
            >
              <option value="">All status</option>
              <option value="MATCHED">Matched</option>
              <option value="UNKNOWN_CARD">Unknown Card</option>
              <option value="DUPLICATE_SCAN">Duplicate Scan</option>
              <option value="DENIED">Denied</option>
            </select>

            <select
              name="deviceId"
              defaultValue={deviceId}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-blue-300"
            >
              <option value="">All devices</option>
              {devices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.name}
                </option>
              ))}
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
                href="/dashboard/admin/rfid-logs"
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
            RFID Log Records
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Scan Time</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">RFID UID</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Student</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Student No</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Device</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-10 text-center text-sm text-muted-foreground"
                      >
                        No RFID logs found.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="border-t border-slate-100">
                        <td className="px-4 py-4 text-slate-700">
                          {formatDateTime(log.scanTime)}
                        </td>
                        <td className="px-4 py-4 font-medium text-slate-900">
                          {log.rfidUid}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {log.student?.user.name ?? "-"}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {log.student?.studentNo ?? "-"}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {log.device?.name ?? "-"}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(
                              log.status
                            )}`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          {log.message ?? "-"}
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
                href={buildRfidLogsQuery({
                  q,
                  status,
                  deviceId,
                  page: Math.max(page - 1, 1),
                })}
                className={`inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 font-medium text-slate-700 ${
                  page <= 1 ? "pointer-events-none opacity-50" : ""
                }`}
              >
                Previous
              </a>

              <a
                href={buildRfidLogsQuery({
                  q,
                  status,
                  deviceId,
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