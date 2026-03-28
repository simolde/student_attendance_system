import Link from "next/link";
import { ShieldCheck, LockKeyhole, GraduationCap, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="portal-shell min-h-screen px-4 py-8 md:px-6 md:py-10">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl items-center gap-8 xl:grid-cols-[1.08fr_0.92fr]">
        <section className="portal-card overflow-hidden border-0 p-0">
          <div className="portal-hero relative h-full">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_28%)]" />
            <div className="relative flex h-full flex-col justify-between px-6 py-8 text-white md:px-10 md:py-12">
              <div className="space-y-5">
                <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                  StarDigiTech Solutions Inc.
                </div>

                <div className="space-y-3">
                  <h1 className="max-w-2xl text-4xl font-bold tracking-tight md:text-5xl">
                    Smarter school attendance for modern campuses
                  </h1>
                  <p className="max-w-2xl text-sm leading-7 text-blue-50/90 md:text-base">
                    Access attendance, student records, announcements, and school
                    operations through a clean desktop portal designed for admins,
                    teachers, staff, and students.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                    <div className="flex items-center gap-2 text-blue-100">
                      <ShieldCheck className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-[0.16em]">
                        Secure Access
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-blue-50/90">
                      Role-based access for administrators, teachers, staff, and students.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                    <div className="flex items-center gap-2 text-blue-100">
                      <GraduationCap className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-[0.16em]">
                        School Portal
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-blue-50/90">
                      Track attendance, monitor classes, and review records in one place.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.16em] text-blue-100/80">
                  Portal Theme
                </p>
                <p className="mt-2 text-sm text-blue-50/90">
                  UltraTech-inspired desktop school management experience
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-xl">
          <Card className="portal-card">
            <CardContent className="p-6 md:p-8">
              <div className="mb-8 space-y-2">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-50 text-blue-700">
                  <LockKeyhole className="h-7 w-7" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                  Sign in to your portal
                </h2>
                <p className="text-sm leading-6 text-slate-600">
                  Enter your account credentials to continue to the student attendance system.
                </p>
              </div>

              <form className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-slate-700">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm shadow-sm outline-none transition focus:border-blue-300"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm shadow-sm outline-none transition focus:border-blue-300"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary px-5 text-sm font-medium text-primary-foreground"
                >
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </form>

              <div className="mt-6 flex items-center justify-between gap-3 text-sm">
                <Link href="/" className="font-medium text-slate-600 hover:text-slate-900">
                  Back to home
                </Link>
                <span className="text-slate-400">Secure school portal access</span>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}