"use client";

import { Suspense } from "react";
import LoginForm from "./login-form";
import { ShieldCheck, GraduationCap } from "lucide-react";

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
          <Suspense fallback={<div>Loading...</div>}>
            <LoginForm />
          </Suspense>
          
        </section>
      </div>
    </div>
  );
}