"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Shield,
  Users,
  GraduationCap,
  ClipboardCheck,
  History,
  UserCircle2,
  KeyRound,
  FileText,
  School,
} from "lucide-react";
import { hasRole, ROLES } from "@/lib/rbac";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

function SidebarLink({
  href,
  label,
  icon: Icon,
}: NavItem) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
        active
          ? "bg-black text-white"
          : "text-slate-700 hover:bg-slate-100"
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
}

function SidebarSection({
  title,
  items,
}: {
  title: string;
  items: NavItem[];
}) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-1">
      <p className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>

      <div className="space-y-1">
        {items.map((item) => (
          <SidebarLink key={item.href} {...item} />
        ))}
      </div>
    </div>
  );
}

export default function DashboardSidebarNav({ role }: { role: string }) {
  const dashboardLinks: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ];

  const adminLinks: NavItem[] = hasRole(role, [ROLES.SUPER_ADMIN, ROLES.ADMIN])
    ? [
        { href: "/dashboard/admin/users", label: "User Management", icon: Users },
        {
          href: "/dashboard/admin/students",
          label: "Student Management",
          icon: GraduationCap,
        },
        { href: "/dashboard/admin/audit-logs", label: "Audit Logs", icon: FileText },
      ]
    : [];

  const teacherLinks: NavItem[] = hasRole(role, [
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.TEACHER,
    ROLES.STAFF,
  ])
    ? [
        {
          href: "/dashboard/teacher/attendance",
          label: "Attendance",
          icon: ClipboardCheck,
        },
        {
          href: "/dashboard/teacher/attendance/history",
          label: "Attendance History",
          icon: History,
        },
      ]
    : [];

  const studentLinks: NavItem[] = hasRole(role, [ROLES.STUDENT])
    ? [
        {
          href: "/dashboard/student/attendance",
          label: "My Attendance",
          icon: ClipboardCheck,
        },
        {
          href: "/dashboard/student/profile",
          label: "My Profile",
          icon: UserCircle2,
        },
      ]
    : [];

  const accountLinks: NavItem[] = [
    { href: "/dashboard/account", label: "My Account", icon: UserCircle2 },
    {
      href: "/dashboard/change-password",
      label: "Change Password",
      icon: KeyRound,
    },
  ];

  return (
    <nav className="space-y-4">
      <SidebarSection title="Dashboard" items={dashboardLinks} />

      {adminLinks.length > 0 && (
        <SidebarSection title="Admin" items={adminLinks} />
      )}

      {teacherLinks.length > 0 && (
        <SidebarSection title="Teacher" items={teacherLinks} />
      )}

      {studentLinks.length > 0 && (
        <SidebarSection title="Student" items={studentLinks} />
      )}

      <SidebarSection title="Account" items={accountLinks} />
    </nav>
  );
}