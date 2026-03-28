import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import DashboardTopbar from "@/components/layout/dashboard-topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Cpu,
  Radio,
  MapPin,
  Search,
  Filter,
  CheckCircle2,
  Ban,
} from "lucide-react";

const PAGE_SIZE = 12;

function buildRfidDevicesQuery(params: {
  q?: string;
  status?: string;
  page?: string | number;
}) {
  const search = new URLSearchParams();

  if (params.q) search.set("q", params.q);
  if (params.status) search.set("status", params.status);
  if (params.page) search.set("page", String(params.page));

  return `/dashboard/admin/rfid-devices?${search.toString()}`;
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

export default async function RfidDevicesPage({
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
      status === "ACTIVE"
        ? { isActive: true }
        : status === "INACTIVE"
          ? { isActive: false }
          : {},
      q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { location: { contains: q, mode: "insensitive" as const } },
              { deviceCode: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {},
    ],
  };

  const [totalCount, devices, allDevices, totalLogs] = await Promise.all([
    prisma.rfidDevice.count({ where }),
    prisma.rfidDevice.findMany({
      where,
      include: {
        _count: {
          select: {
            rfidLogs: true,
          },
        },
      },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.rfidDevice.findMany({
      select: {
        id: true,
        isActive: true,
      },
    }),
    prisma.rfidLog.count(),
  ]);

  const totalPages = Math.max(Math.ceil(totalCount / PAGE_SIZE), 1);
  const activeCount = allDevices.filter((item) => item.isActive).length;
  const inactiveCount = allDevices.filter((item) => !item.isActive).length;

  return (
    <div className="portal-shell space-y-6">
      <DashboardTopbar
        title="RFID Devices"
        subtitle="Monitor RFID readers, status, locations, and scan activity."
        userName={session.user.name ?? session.user.email}
      />

      <section className="portal-card overflow-hidden border-0 p-0">
        <div className="portal-hero relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_28%)]" />
          <div className="relative grid gap-6 px-6 py-8 md:px-8 md:py-10 xl:grid-cols-[1.45fr_0.95fr]">
            <div className="space-y-4 text-white">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                RFID Device Management
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Manage RFID readers across campus
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-blue-50/90 md:text-base">
                  Review active devices, check locations, and monitor how many
                  scan logs each RFID reader has generated.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <Cpu className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Total Devices
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{allDevices.length}</div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Active Devices
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{activeCount}</div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <Ban className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Inactive Devices
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{inactiveCount}</div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <Radio className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Total Scan Logs
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold">{totalLogs}</div>
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
                placeholder="Search device name, code, or location"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm shadow-sm outline-none transition focus:border-blue-300"
              />
            </div>

            <select
              name="status"
              defaultValue={status}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-blue-300"
            >
              <option value="">All status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
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
                href="/dashboard/admin/rfid-devices"
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
            RFID Device Records
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Device Name</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Device Code</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Location</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Logs</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Created</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-10 text-center text-sm text-muted-foreground"
                      >
                        No RFID devices found.
                      </td>
                    </tr>
                  ) : (
                    devices.map((device) => (
                      <tr key={device.id} className="border-t border-slate-100">
                        <td className="px-4 py-4 font-medium text-slate-900">
                          {device.name}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {device.deviceCode ?? "-"}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2 text-slate-700">
                            <MapPin className="h-4 w-4 text-slate-400" />
                            <span>{device.location ?? "-"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                              device.isActive
                                ? "border-green-200 bg-green-50 text-green-700"
                                : "border-slate-200 bg-slate-50 text-slate-700"
                            }`}
                          >
                            {device.isActive ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {device._count.rfidLogs}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {formatDateTime(device.createdAt)}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {formatDateTime(device.updatedAt)}
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
                href={buildRfidDevicesQuery({
                  q,
                  status,
                  page: Math.max(page - 1, 1),
                })}
                className={`inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 font-medium text-slate-700 ${
                  page <= 1 ? "pointer-events-none opacity-50" : ""
                }`}
              >
                Previous
              </a>

              <a
                href={buildRfidDevicesQuery({
                  q,
                  status,
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