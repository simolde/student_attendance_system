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
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import ImportStudentsForm from "./upload-form";

export default async function ImportStudentsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasRole(session.user.role, [ROLES.SUPER_ADMIN, ROLES.ADMIN])) {
    redirect("/unauthorized");
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Import Students"
        description="Upload an Excel file to create or update student accounts and enrollments."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin", href: "/dashboard/admin" },
          { label: "Student Management", href: "/dashboard/admin/students" },
          { label: "Import Students" },
        ]}
        actions={
          <Button asChild variant="outline">
            <a
              href="/templates/student_import_template.xlsx"
              download="student_import_template.xlsx"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </a>
          </Button>
        }
      />

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Excel Import</CardTitle>
          <CardDescription>
            Required columns: student_no, full_name, email, section. Optional:
            school_year, status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImportStudentsForm />
        </CardContent>
      </Card>
    </div>
  );
}