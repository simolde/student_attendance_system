import { auth } from "@/auth";
import { redirect } from "next/navigation";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="hidden lg:flex lg:flex-col lg:justify-between bg-[#0f172a] p-10 text-white">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-lg font-bold">
                SA
              </div>
              <div>
                <h1 className="text-xl font-semibold">Student Attendance</h1>
                <p className="text-sm text-slate-300">Management System</p>
              </div>
            </div>

            <div className="mt-16 max-w-md">
              <h2 className="text-4xl font-bold leading-tight">
                Manage attendance with a cleaner, faster workflow.
              </h2>
              <p className="mt-4 text-base text-slate-300">
                Track students, manage users, and review attendance records in one
                streamlined system.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-medium">Role-based access</p>
              <p className="mt-1 text-sm text-slate-300">
                Separate tools for administrators, teachers, staff, and students.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-medium">Attendance tracking</p>
              <p className="mt-1 text-sm text-slate-300">
                Record daily attendance, review history, and export records when needed.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white">
                  SA
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-slate-900">
                    Student Attendance
                  </h1>
                  <p className="text-sm text-slate-500">Management System</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
              <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                  Welcome back
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Sign in to continue to your dashboard.
                </p>
              </div>

              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}