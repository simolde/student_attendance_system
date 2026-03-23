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
import { Download, KeyRound, TriangleAlert } from "lucide-react";
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
        description="Upload an Excel file to create or update student accounts, sections, enrollments, and optional RFID assignments."
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

      <Card className="border-amber-200 bg-amber-50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-950">
            <TriangleAlert className="h-5 w-5" />
            Imported Account Password Notice
          </CardTitle>
          <CardDescription className="text-amber-900">
            Review this before importing students.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-amber-950">
          <div className="rounded-xl border border-amber-200 bg-white/70 p-4">
            <div className="flex items-start gap-3">
              <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <div className="space-y-1">
                <p className="font-medium">Default imported password</p>
                <p>
                  New imported student accounts currently use:
                  <span className="ml-1 rounded-md bg-amber-100 px-2 py-1 font-mono text-xs">
                    Starland@123
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-white/70 p-4">
            <p className="font-medium">Recommended policy</p>
            <ul className="mt-2 space-y-1 text-sm text-amber-900">
              <li>Students should change their password after first login.</li>
              <li>Do not share the default password publicly.</li>
              <li>
                If a student cannot log in, check the imported email, student
                number, and enrollment first.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Template Guide</CardTitle>
          <CardDescription>
            Use the downloadable template and keep the required headers
            unchanged.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-900">
              Required columns
            </p>
            <p className="mt-1 text-sm text-slate-600">
              student_no, full_name, email, section, grade_level
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-900">
              Optional columns
            </p>
            <p className="mt-1 text-sm text-slate-600">
              school_year, status, rfid_uid
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="border-b bg-slate-50 px-4 py-3">
              <p className="text-sm font-medium text-slate-900">Sample row</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">
                      student_no
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      full_name
                    </th>
                    <th className="px-4 py-3 text-left font-medium">email</th>
                    <th className="px-4 py-3 text-left font-medium">section</th>
                    <th className="px-4 py-3 text-left font-medium">
                      grade_level
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      school_year
                    </th>
                    <th className="px-4 py-3 text-left font-medium">status</th>
                    <th className="px-4 py-3 text-left font-medium">
                      rfid_uid
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="px-4 py-3">2026-0001</td>
                    <td className="px-4 py-3">Juan Dela Cruz</td>
                    <td className="px-4 py-3">juan@email.com</td>
                    <td className="px-4 py-3">PICASSO</td>
                    <td className="px-4 py-3">GRADE_7</td>
                    <td className="px-4 py-3">2026-2027</td>
                    <td className="px-4 py-3">ENROLLED</td>
                    <td className="px-4 py-3">04A1B29C</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Excel Import</CardTitle>
          <CardDescription>
            Required columns: student_no, full_name, email, section,
            grade_level. Optional columns: school_year, status, rfid_uid.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImportStudentsForm />
        </CardContent>
      </Card>
    </div>
  );
}