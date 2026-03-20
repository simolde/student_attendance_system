import Link from "next/link";
import { SearchX, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <SearchX className="h-8 w-8 text-slate-700" />
            </div>

            <p className="mt-6 text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
              404 Error
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Page Not Found
            </h1>

            <p className="mt-3 max-w-md text-sm text-slate-600 sm:text-base">
              The page you are looking for does not exist or may have been moved.
              Please return to the homepage or dashboard.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/dashboard">
                  <Home className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Link>
              </Button>

              <Button variant="outline" asChild>
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}