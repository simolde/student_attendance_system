import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Bell,
  ClipboardCheck,
  Radio,
  Users,
  FileBarChart2,
} from "lucide-react";

const features = [
  {
    title: "Attendance Recording",
    description:
      "Record daily attendance with clean workflows for teachers, staff, and administrators.",
    icon: ClipboardCheck,
  },
  {
    title: "RFID Monitoring",
    description:
      "Track RFID scans, unknown cards, denied attempts, and device activity from one portal.",
    icon: Radio,
  },
  {
    title: "Student Management",
    description:
      "Review students, sections, school years, and import history in a unified admin experience.",
    icon: GraduationCap,
  },
  {
    title: "Announcements",
    description:
      "Share school notices and reminders across student, parent, teacher, and staff portals.",
    icon: Bell,
  },
  {
    title: "User Access Control",
    description:
      "Keep role-based access organized for admins, teachers, staff, parents, and students.",
    icon: Users,
  },
  {
    title: "Reports and Insights",
    description:
      "Review attendance summaries and operational reporting in a clean desktop layout.",
    icon: FileBarChart2,
  },
];

export default function HomePage() {
  return (
    <main className="portal-shell min-h-screen px-4 py-6 md:px-6 md:py-8">
      <section className="portal-card overflow-hidden border-0 p-0">
        <div className="portal-hero relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_28%)]" />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-10 text-white md:px-10 md:py-14 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                StarDigiTech Solutions Inc.
              </div>

              <div className="space-y-4">
                <h1 className="max-w-4xl text-4xl font-bold tracking-tight md:text-5xl xl:text-6xl">
                  Smart school attendance and management portal
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-blue-50/90 md:text-base">
                  A modern school portal built for attendance recording, RFID monitoring,
                  student management, announcements, and role-based access across
                  administrators, teachers, staff, parents, and students.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold text-slate-900"
                >
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>

                <Link
                  href="/dashboard"
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur"
                >
                  Open Dashboard
                </Link>
              </div>
            </div>

            <div className="grid gap-4 self-stretch sm:grid-cols-2">
              <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Secure Access
                  </span>
                </div>
                <div className="mt-3 text-lg font-semibold">Role-based portal access</div>
                <p className="mt-2 text-sm leading-6 text-blue-50/90">
                  Controlled access for different school users and workflows.
                </p>
              </div>

              <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100">
                  <ClipboardCheck className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    Daily Workflow
                  </span>
                </div>
                <div className="mt-3 text-lg font-semibold">Attendance-first design</div>
                <p className="mt-2 text-sm leading-6 text-blue-50/90">
                  Built for daily class recording, review, and reporting.
                </p>
              </div>

              <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur sm:col-span-2">
                <div className="flex items-center gap-2 text-blue-100">
                  <GraduationCap className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    School Management
                  </span>
                </div>
                <div className="mt-3 text-lg font-semibold">
                  Unified portal for students, parents, teachers, staff, and admins
                </div>
                <p className="mt-2 text-sm leading-6 text-blue-50/90">
                  Organize attendance, records, announcements, and operations through a clean desktop experience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-7xl space-y-5">
        <div className="space-y-2">
          <h2 className="portal-section-title">Core Platform Features</h2>
          <p className="portal-section-desc">
            Built around school operations, attendance workflows, and clean portal navigation.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div key={feature.title} className="portal-card p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <Icon className="h-6 w-6" />
                </div>

                <h3 className="mt-5 text-xl font-semibold tracking-tight text-slate-900">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-7xl">
        <div className="portal-card p-6 md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Ready to use the portal?
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-slate-600">
                Sign in to access attendance tools, student records, RFID pages,
                reports, and school management features.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground"
              >
                Go to Login
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700"
              >
                Open Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}