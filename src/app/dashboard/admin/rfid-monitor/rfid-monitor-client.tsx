"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type MonitorLog = {
  id: string;
  rfidUid: string;
  status: "MATCHED" | "UNKNOWN_CARD" | "DUPLICATE_SCAN" | "DENIED";
  message: string | null;
  scanTime: string;
  scanTimeDisplay: string;
  student: {
    studentNo: string;
    name: string | null;
    email: string;
  } | null;
  device: {
    name: string;
    deviceCode: string | null;
    location: string | null;
  } | null;
};

function getBadgeVariant(status: MonitorLog["status"]) {
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

export default function RfidMonitorClient() {
  const [logs, setLogs] = useState<MonitorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  async function loadLogs() {
    try {
      const response = await fetch("/api/rfid/monitor", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load RFID monitor logs");
      }

      const data = (await response.json()) as { logs: MonitorLog[] };
      setLogs(data.logs);
      setLastUpdated(
        new Intl.DateTimeFormat("en-PH", {
          timeZone: "Asia/Manila",
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }).format(new Date())
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();

    const interval = setInterval(() => {
      loadLogs();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    return {
      matched: logs.filter((log) => log.status === "MATCHED").length,
      unknown: logs.filter((log) => log.status === "UNKNOWN_CARD").length,
      denied: logs.filter((log) => log.status === "DENIED").length,
      duplicate: logs.filter((log) => log.status === "DUPLICATE_SCAN").length,
    };
  }, [logs]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs text-slate-500">Matched</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.matched}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs text-slate-500">Unknown</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.unknown}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs text-slate-500">Denied</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.denied}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs text-slate-500">Duplicate</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.duplicate}</p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-sm text-slate-600">
          Last updated: <span className="font-medium text-slate-900">{lastUpdated || "-"}</span>
        </p>
        <Button type="button" variant="outline" onClick={loadLogs}>
          Refresh Now
        </Button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">
          Loading live scan feed...
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          No RFID scan activity yet.
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={getBadgeVariant(log.status) as never}>
                      {log.status}
                    </Badge>
                    <span className="text-sm text-slate-500">{log.scanTimeDisplay}</span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-900">
                      RFID UID: {log.rfidUid}
                    </p>

                    {log.student ? (
                      <p className="text-sm text-slate-700">
                        {log.student.name ?? "-"} • {log.student.studentNo} • {log.student.email}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-500">No linked student</p>
                    )}

                    {log.device ? (
                      <p className="text-sm text-slate-500">
                        Device: {log.device.name}
                        {log.device.deviceCode ? ` (${log.device.deviceCode})` : ""}
                        {log.device.location ? ` • ${log.device.location}` : ""}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-500">Device: -</p>
                    )}
                  </div>
                </div>

                <div className="max-w-md text-sm text-slate-600">
                  {log.message ?? "-"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}