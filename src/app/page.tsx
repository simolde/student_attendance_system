import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  CheckCircle2,
  Users,
  ClipboardCheck,
  BarChart3,
  ShieldCheck,
  School,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <img
                src="/logo.png"
                alt="Logo"
                width={32}
                height={32}
                className="logo"
              />
            <div>
              <h1 className="text-base font-bold text-slate-900">
                StarDigiTech Solutions
              </h1>
              <p className="text-xs text-slate-500">
                Student Attendance Portal
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-slate-600 hover:text-sky-600">
              Features
            </a>
            <a href="#about" className="text-sm text-slate-600 hover:text-sky-600">
              About
            </a>
            <a href="#reports" className="text-sm text-slate-600 hover:text-sky-600">
              Reports
            </a>
            <a href="#contact" className="text-sm text-slate-600 hover:text-sky-600">
              Contact
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" className="hidden md:inline-flex">
              Login
            </Button>
            <Button className="rounded-xl bg-sky-600 hover:bg-sky-700">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-sky-50 via-white to-slate-50" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:px-8 lg:py-28">
          <div>
            <Badge className="rounded-full bg-sky-100 text-sky-700 hover:bg-sky-100">
              Smart School Management
            </Badge>

            <h2 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              Elegant student attendance and school monitoring system
            </h2>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Manage attendance, student records, reports, and school activity in
              one clean and modern portal designed for schools and institutions.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button className="h-12 rounded-xl bg-sky-600 px-6 text-base hover:bg-sky-700">
                Explore Portal
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                className="h-12 rounded-xl border-slate-300 bg-white px-6 text-base"
              >
                View Features
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap gap-6 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-sky-600" />
                Daily attendance
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-sky-600" />
                Student records
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-sky-600" />
                Reports and analytics
              </div>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="relative">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Today’s Attendance</p>
                  <h3 className="text-3xl font-bold text-slate-900">1,248</h3>
                </div>
                <div className="rounded-xl bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
                  Active
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-2xl bg-sky-50 p-4">
                  <p className="text-xs text-slate-500">Present</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">1,102</p>
                </div>
                <div className="rounded-2xl bg-amber-50 p-4">
                  <p className="text-xs text-slate-500">Late</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">96</p>
                </div>
                <div className="rounded-2xl bg-rose-50 p-4">
                  <p className="text-xs text-slate-500">Absent</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">50</p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-medium text-slate-800">Weekly Trend</p>
                  <BarChart3 className="h-5 w-5 text-sky-600" />
                </div>

                <div className="flex h-40 items-end gap-3">
                  {[45, 72, 58, 84, 68, 92, 80].map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-xl bg-sky-500"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-10 text-center sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          <div>
            <p className="text-3xl font-bold text-slate-900">10k+</p>
            <p className="mt-2 text-sm text-slate-500">Student Records</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900">99%</p>
            <p className="mt-2 text-sm text-slate-500">Attendance Accuracy</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900">Real-Time</p>
            <p className="mt-2 text-sm text-slate-500">Monitoring</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900">Secure</p>
            <p className="mt-2 text-sm text-slate-500">Data Management</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge className="rounded-full bg-sky-100 text-sky-700 hover:bg-sky-100">
            Portal Features
          </Badge>
          <h2 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
            Everything your school needs in one place
          </h2>
          <p className="mt-4 text-slate-600">
            A clean and organized platform for attendance, student records,
            school monitoring, and reporting.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              icon: <ClipboardCheck className="h-6 w-6 text-sky-600" />,
              title: "Attendance Tracking",
              desc: "Monitor daily attendance with accurate and easy-to-read records.",
            },
            {
              icon: <Users className="h-6 w-6 text-sky-600" />,
              title: "Student Management",
              desc: "Organize student profiles, class sections, and important school data.",
            },
            {
              icon: <BarChart3 className="h-6 w-6 text-sky-600" />,
              title: "Reports & Analytics",
              desc: "View summaries, trends, absences, and attendance performance.",
            },
            {
              icon: <ShieldCheck className="h-6 w-6 text-sky-600" />,
              title: "Secure Access",
              desc: "Protect records with a reliable and school-ready system.",
            },
          ].map((item, i) => (
            <Card
              key={i}
              className="rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-3 text-slate-600">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* About / Reports */}
      <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <Card id="about" className="rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <CardContent className="p-8">
              <p className="text-sm font-medium text-sky-700">About the System</p>
              <h3 className="mt-3 text-3xl font-bold text-slate-900">
                Designed for schools and academic institutions
              </h3>
              <p className="mt-4 text-slate-600">
                This portal helps schools simplify attendance management, reduce
                manual work, and improve student record monitoring with a more
                professional and organized workflow.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  "Clean dashboard for school staff",
                  "Easy student attendance monitoring",
                  "Simple and professional interface",
                  "Reliable data for daily operations",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-sky-600" />
                    <span className="text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card id="reports" className="rounded-[2rem] border border-slate-200 bg-sky-50 shadow-sm">
            <CardContent className="p-8">
              <p className="text-sm font-medium text-sky-700">Reports</p>
              <h3 className="mt-3 text-3xl font-bold text-slate-900">
                Better visibility for attendance records
              </h3>
              <p className="mt-4 text-slate-600">
                Access daily summaries, absence lists, attendance history, and
                performance insights through a modern reporting dashboard.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  "Daily attendance summary",
                  "Late and absent monitoring",
                  "Section and class filtering",
                  "Printable and export-ready records",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-sky-600" />
                    <span className="text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
        <div className="rounded-[2rem] bg-sky-600 px-8 py-14 text-center text-white shadow-xl">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Build a smarter school attendance experience
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sky-100">
            Give your students, teachers, and school staff a clean and elegant
            attendance portal that is simple, modern, and reliable.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Button className="h-12 rounded-xl bg-white px-6 text-sky-700 hover:bg-slate-100">
              Request Demo
            </Button>
            <Button
              variant="outline"
              className="h-12 rounded-xl border-white bg-transparent px-6 text-white hover:bg-white/10"
            >
              Contact Us
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}