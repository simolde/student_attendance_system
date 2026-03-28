import Link from "next/link";
import { ShieldAlert, ArrowLeft, LayoutDashboard, LockKeyhole } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function UnauthorizedPage() {
  return (
    <div className="portal-shell flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl">
        <Card className="portal-card overflow-hidden border-0 p-0">
          <div className="portal-hero relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_28%)]" />
            <div className="relative px-6 py-10 text-white md:px-10 md:py-12">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                Access Restricted
              </div>

              <div className="mt-5 flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/12 backdrop-blur">
                  <ShieldAlert className="h-8 w-8" />
                </div>

                <div className="space-y-3">
                  <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                    You are not authorized to view this page
                  </h1>
                  <p className="max-w-2xl text-sm leading-6 text-blue-50/90 md:text-base">
                    Your current account does not have permission to access this
                    part of the student attendance system portal.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <CardContent className="grid gap-6 p-6 md:grid-cols-[1.2fr_0.8fr] md:p-8">
            <div className="space-y-4">
              <div className="portal-card-soft p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <LockKeyhole className="h-4 w-4 text-slate-600" />
                  Access Note
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  This page may be limited to administrators, teachers, or other
                  authorized roles only. If you believe this is incorrect, contact
                  your system administrator.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/dashboard"
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground"
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Link>

                <Link
                  href="/login"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="portal-card-soft p-5">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Portal Status
                </div>
                <div className="mt-2 text-lg font-semibold text-slate-900">
                  Permission Check Active
                </div>
              </div>

              <div className="portal-card-soft p-5">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Suggested Action
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-900">
                  Return to a page allowed for your account role.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}