import Link from "next/link";
import {
  ShieldCheck,
  GraduationCap,
  Radio,
  FileBarChart2,
  Users,
  ArrowRight,
} from "lucide-react";

const pillars = [
  {
    title: "Attendance Workflows",
    description:
      "Built for daily attendance recording, review, and summary reporting across school roles.",
    icon: ShieldCheck,
  },
  {
    title: "Student Management",
    description:
      "Supports school years, sections, student records, and organized administrative workflows.",
    icon: GraduationCap,
  },
  {
    title: "RFID Monitoring",
    description:
      "Tracks card activity, reader devices, and log status for better attendance visibility.",
    icon: Radio,
  },
  {
    title: "Reporting",
    description:
      "Designed for clean, readable attendance summaries and future export-ready reporting pages.",
    icon: FileBarChart2,
  },
  {
    title: "Role-Based Access",
    description:
      "Supports admin, teacher, staff, parent, and student experiences through separate portal flows.",
    icon: Users,
  },
];

export default function AboutPage() {
  return (
    <main className="portal-shell min-h-screen px-4 py-6 md:px-6 md:py-8">
      <section className="portal-card overflow-hidden border-0 p-0">
        <div className="portal-hero relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_28%)]" />
          <div className="relative mx-auto max-w-7xl px-6 py-10 text-white md:px-10 md:py-14">
            <div className="space-y-5">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                About StarDigiTech Solutions Inc.
              </div>

              <div className="space-y-4">
                <h1 className="max-w-4xl text-4xl font-bold tracking-tight md:text-5xl">
                  A modern school attendance and management portal
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-blue-50/90 md:text-base">
                  This platform is designed to help schools organize attendance,
                  RFID monitoring, student management, announcements, and reporting
                  with a clean desktop-first experience.
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
                  href="/"
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-7xl space-y-5">
        <div className="space-y-2">
          <h2 className="portal-section-title">What the platform focuses on</h2>
          <p className="portal-section-desc">
            Core school operations built around attendance, records, and structured portal access.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;

            return (
              <div key={pillar.title} className="portal-card p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <Icon className="h-6 w-6" />
                </div>

                <h3 className="mt-5 text-xl font-semibold tracking-tight text-slate-900">
                  {pillar.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-7xl">
        <div className="portal-card p-6 md:p-8">
          <div className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Built for organized school operations
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              The system is designed to support school administrators, teachers, staff,
              students, and parents through role-based portal experiences that stay
              clean, readable, and easy to navigate.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}