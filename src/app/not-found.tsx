import Link from "next/link";
import { SearchX, ArrowLeft, LayoutDashboard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFoundPage() {
  return (
    <div className="portal-shell flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl">
        <Card className="portal-card overflow-hidden border-0 p-0">
          <div className="portal-hero relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_28%)]" />
            <div className="relative px-6 py-10 text-white md:px-10 md:py-12">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                Page Not Found
              </div>

              <div className="mt-5 flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/12 backdrop-blur">
                  <SearchX className="h-8 w-8" />
                </div>

                <div className="space-y-3">
                  <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                    We couldn’t find the page you’re looking for
                  </h1>
                  <p className="max-w-2xl text-sm leading-6 text-blue-50/90 md:text-base">
                    The page may have been moved, removed, or the link might be incorrect.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <CardContent className="grid gap-6 p-6 md:grid-cols-[1.2fr_0.8fr] md:p-8">
            <div className="space-y-4">
              <div className="portal-card-soft p-5">
                <div className="text-sm font-semibold text-slate-900">
                  Suggested actions
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Return to the dashboard or go back to the previous page and try another path.
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
                  href="/"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="portal-card-soft p-5">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Status
                </div>
                <div className="mt-2 text-lg font-semibold text-slate-900">404 Not Found</div>
              </div>

              <div className="portal-card-soft p-5">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Portal
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-900">
                  Desktop school portal active
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}