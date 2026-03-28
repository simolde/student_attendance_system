"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ClipboardList,
  Bell,
  Settings,
  ScrollText,
  School,
  Radio,
  Cpu,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SidebarItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const mainItems: SidebarItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Attendance",
    href: "/dashboard/teacher/attendance",
    icon: ClipboardList,
  },
  {
    label: "Attendance History",
    href: "/dashboard/teacher/attendance/history",
    icon: ScrollText,
  },
  {
    label: "Students",
    href: "/dashboard/admin/students",
    icon: GraduationCap,
  },
  {
    label: "Users",
    href: "/dashboard/admin/users",
    icon: Users,
  },
  {
    label: "School Years",
    href: "/dashboard/admin/school-years",
    icon: School,
  },
  {
    label: "RFID Devices",
    href: "/dashboard/admin/rfid-devices",
    icon: Cpu,
  },
  {
    label: "RFID Logs",
    href: "/dashboard/admin/rfid-logs",
    icon: Radio,
  },
  {
    label: "Announcements",
    href: "/dashboard/announcements",
    icon: Bell,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden xl:flex xl:w-70 xl:flex-col xl:border-r xl:border-white/10 xl:bg-[#0d1b42] xl:text-white">
      <div className="border-b border-white/10 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>

          <div>
            <h2 className="text-base font-semibold tracking-tight">
              Student Attendance
            </h2>
            <p className="text-sm text-blue-100/75">
              School Management Portal
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-8 overflow-y-auto px-4 py-6">
        <div className="space-y-2">
          <div className="px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-100/50">
            Navigation
          </div>

          {mainItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition",
                  isActive
                    ? "bg-white/12 text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)]"
                    : "text-blue-100/80 hover:bg-white/8 hover:text-white"
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl transition",
                    isActive
                      ? "bg-white/14 text-white"
                      : "bg-white/5 text-blue-100/75 group-hover:bg-white/10 group-hover:text-white"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>

                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <div className="rounded-2xl bg-white/8 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-blue-100/55">
            Portal Theme
          </p>
          <p className="mt-2 text-sm text-blue-50/85">
            UltraTech-inspired desktop school portal
          </p>
        </div>
      </div>
    </aside>
  );
}