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

export default async function ChangePasswordPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

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
                <li>Use at least 12 characters.</li>
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