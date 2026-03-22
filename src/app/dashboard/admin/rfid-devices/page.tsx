import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect } from "next/navigation";
import PageHeader from "@/components/layout/page-header";
import RfidDeviceForm from "./form";
import { toggleRfidDevice } from "./actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function RfidDevicesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasRole(session.user.role, [ROLES.SUPER_ADMIN, ROLES.ADMIN])) {
    redirect("/unauthorized");
  }

  const devices = await prisma.rfidDevice.findMany({
    include: {
      _count: {
        select: {
          rfidLogs: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="RFID Devices"
        description="Create and manage RFID scanners used by the attendance system."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin", href: "/dashboard/admin" },
          { label: "RFID Devices" },
        ]}
      />

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Create RFID Device</CardTitle>
          <CardDescription>
            Register a new scanner with a unique device code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RfidDeviceForm />
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Device List</CardTitle>
          <CardDescription>
            Manage active and inactive RFID scanners.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {devices.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              No RFID devices found.
            </div>
          ) : (
            devices.map((device) => (
              <div
                key={device.id}
                className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{device.name}</p>
                    {device.isActive ? (
                      <Badge>Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>

                  <p className="text-sm text-slate-600">
                    Code: <span className="font-medium">{device.deviceCode ?? "-"}</span>
                  </p>

                  <p className="text-sm text-slate-600">
                    Location: {device.location ?? "-"}
                  </p>

                  <p className="text-xs text-slate-500">
                    Total logs: {device._count.rfidLogs}
                  </p>
                </div>

                <form action={toggleRfidDevice}>
                  <input type="hidden" name="deviceId" value={device.id} />
                  <Button type="submit" variant="outline">
                    {device.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </form>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}