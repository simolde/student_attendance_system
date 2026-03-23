import Image from "next/image";
import Link from "next/link";
import { SearchX, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src="/kamias.webp"
          alt="School building"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-slate-950/75" />
        <div className="absolute inset-0 bg-linear-to-br from-emerald-900/40 via-slate-950/80 to-yellow-700/20" />
      </div>

      {/* Content */}
      <section className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-5xl">
          <div className="grid overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-2xl backdrop-blur-md lg:grid-cols-2">
            {/* Left */}
            <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-12">
              <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm text-slate-200">
                <SearchX className="h-4 w-4" />
                404 Error
              </div>

              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Page Not Found
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-200 sm:text-base">
                The page you are looking for does not exist, may have been moved,
                or the link may be incorrect. Please return to the dashboard or
                go back to the homepage.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <Link href="/dashboard">
                    <Home className="mr-2 h-4 w-4" />
                    Go to Dashboard
                  </Link>
                </Button>

                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="bg-white/15 text-white hover:bg-white/25"
                >
                  <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right */}
            <div className="relative min-h-75 lg:min-h-full">
              <Image
                src="/kamias.webp"
                alt="School campus"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-slate-950/85 via-slate-950/20 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                    School Attendance System
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    Smart attendance, secure access, and better campus management.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}