import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasRole, ROLES } from "@/lib/rbac";
import PageHeader from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import RfidMonitorClient from "./rfid-monitor-client";

export default async function RfidMonitorPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (
    !hasRole(session.user.role, [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.TEACHER,
      ROLES.STAFF,
    ])
  ) {
    redirect("/unauthorized");
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="RFID Live Monitor"
        description="Watch the latest RFID scans and attendance activity in near real time."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin", href: "/dashboard/admin" },
          { label: "RFID Monitor" },
        ]}
      />

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Live Scan Feed</CardTitle>
          <CardDescription>
            This page refreshes automatically every 5 seconds.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RfidMonitorClient />
        </CardContent>
      </Card>
    </div>
  );
}