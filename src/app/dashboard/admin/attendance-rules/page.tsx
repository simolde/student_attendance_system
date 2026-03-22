import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect } from "next/navigation";
import PageHeader from "@/components/layout/page-header";
import AttendanceRuleForm from "./form";
import { toggleAttendanceRuleActive } from "./actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function AttendanceRulesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasRole(session.user.role, [ROLES.SUPER_ADMIN, ROLES.ADMIN])) {
    redirect("/unauthorized");
  }

  const [rules, sections] = await Promise.all([
    prisma.attendanceRule.findMany({
      include: {
        section: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.section.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        gradeLevel: true,
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Attendance Rules"
        description="Configure grade-level schedules, section overrides, and fallback attendance rules."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin", href: "/dashboard/admin" },
          { label: "Attendance Rules" },
        ]}
      />

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Create Attendance Rule</CardTitle>
          <CardDescription>
            Create a rule for a grade level, a specific section, or a default fallback.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AttendanceRuleForm sections={sections} />
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Rule List</CardTitle>
          <CardDescription>
            Rules can be active or inactive. Matching priority is section, then grade level, then default.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {rules.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              No attendance rules found.
            </div>
          ) : (
            rules.map((rule) => (
              <div
                key={rule.id}
                className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{rule.name}</p>
                    {rule.isActive ? <Badge>Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                    {rule.isDefault ? <Badge variant="outline">Default</Badge> : null}
                    {rule.gradeLevel ? <Badge variant="outline">{rule.gradeLevel}</Badge> : null}
                    {rule.section ? <Badge variant="outline">{rule.section.name}</Badge> : null}
                  </div>

                  <div className="text-sm text-slate-600">
                    <p>
                      Time In: {rule.timeInStart} to {rule.timeInEnd}
                    </p>
                    <p>Late After: {rule.lateAfter}</p>
                    <p>
                      Time Out: {rule.timeOutStart ?? "-"} to {rule.timeOutEnd ?? "-"}
                    </p>
                  </div>
                </div>

                <form action={toggleAttendanceRuleActive}>
                  <input type="hidden" name="ruleId" value={rule.id} />
                  <Button type="submit" variant="outline">
                    {rule.isActive ? "Deactivate" : "Activate"}
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