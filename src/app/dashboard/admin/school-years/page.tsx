import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect } from "next/navigation";
import PageHeader from "@/components/layout/page-header";
import SchoolYearForm from "./form";
import { activateSchoolYear } from "./actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function formatDate(date: Date | null) {
  if (!date) return "-";
  return date.toISOString().slice(0, 10);
}

export default async function SchoolYearsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasRole(session.user.role, [ROLES.SUPER_ADMIN, ROLES.ADMIN])) {
    redirect("/unauthorized");
  }

  const schoolYears = await prisma.schoolYear.findMany({
    orderBy: {
      startDate: "desc",
    },
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="School Years"
        description="Create and manage school years for enrollment and attendance."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin", href: "/dashboard/admin" },
          { label: "School Years" },
        ]}
      />

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Create School Year</CardTitle>
          <CardDescription>
            Add a new school year and optionally make it active.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SchoolYearForm />
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>School Year List</CardTitle>
          <CardDescription>
            Manage which school year is currently active.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {schoolYears.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              No school years found.
            </div>
          ) : (
            schoolYears.map((schoolYear) => (
              <div
                key={schoolYear.id}
                className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">
                      {schoolYear.name}
                    </p>
                    {schoolYear.isActive ? <Badge>Active</Badge> : null}
                  </div>

                  <p className="text-sm text-slate-600">
                    {formatDate(schoolYear.startDate)} to{" "}
                    {formatDate(schoolYear.endDate)}
                  </p>
                </div>

                {!schoolYear.isActive ? (
                  <form action={activateSchoolYear}>
                    <input
                      type="hidden"
                      name="schoolYearId"
                      value={schoolYear.id}
                    />
                    <Button type="submit" variant="outline">
                      Set Active
                    </Button>
                  </form>
                ) : (
                  <Button type="button" disabled>
                    Active
                  </Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}