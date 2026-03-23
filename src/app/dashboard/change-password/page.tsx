import { auth } from "@/auth";
import { redirect } from "next/navigation";
import PageHeader from "@/components/layout/page-header";
import ChangePasswordForm from "./form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TriangleAlert } from "lucide-react";

export default async function ChangePasswordPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const mustChangePassword = session.user.mustChangePassword === true;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Change Password"
        description="Update your password to keep your account secure."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Change Password" },
        ]}
      />

      {mustChangePassword ? (
        <Card className="border-amber-200 bg-amber-50 shadow-sm">
          <CardContent className="flex items-start gap-3 p-5">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div className="space-y-1">
              <p className="font-medium text-amber-950">
                Password update required
              </p>
              <p className="text-sm text-amber-900">
                You must change your password before continuing to the rest of
                the dashboard.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Password Security</CardTitle>
            <CardDescription>
              Keep your account safe with a strong password.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Signed in as
              </p>
              <p className="mt-2 text-sm font-medium text-slate-900">
                {session.user.name ?? session.user.email}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Password Tips
              </p>
              <ul className="mt-2 space-y-2 text-sm text-slate-600">
                <li>Use at least 8 characters.</li>
                <li>Include uppercase, lowercase, numbers, and symbols.</li>
                <li>Do not reuse old or common passwords.</li>
              </ul>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Important
              </p>
              <p className="mt-2 text-sm text-slate-600">
                After changing your password, use the new password the next time
                you sign in.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Update Password</CardTitle>
            <CardDescription>
              Enter your current password, then choose a new one.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}