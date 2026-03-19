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
  ChevronDown,
} from "lucide-react";
import { hasRole, ROLES } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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

function SidebarGroup({
  title,
  icon: Icon,
  items,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
  defaultOpen?: boolean;
}) {
  const pathname = usePathname();

  const isAnyActive = items.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  return (
    <Collapsible defaultOpen={defaultOpen || isAnyActive} className="space-y-1">
      <CollapsibleTrigger
        className={cn(
          "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition",
          isAnyActive
            ? "bg-slate-100 font-medium text-slate-900"
            : "text-slate-700 hover:bg-slate-100"
        )}
      >
        <div className="flex items-center gap-3">
          <Icon className="h-4 w-4" />
          <span>{title}</span>
        </div>
        <ChevronDown className="h-4 w-4" />
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-1 pl-4">
        {items.map((item) => (
          <SidebarLink key={item.href} {...item} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function DashboardSidebarNav({ role }: { role: string }) {
  const commonLinks: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ];

  const accountLinks: NavItem[] = [
    { href: "/dashboard/account", label: "My Account", icon: UserCircle2 },
    { href: "/dashboard/change-password", label: "Change Password", icon: KeyRound },
  ];

  const adminLinks: NavItem[] = [
    { href: "/dashboard/admin/users", label: "User Management", icon: Users },
    { href: "/dashboard/admin/students", label: "Student Management", icon: GraduationCap },
    { href: "/dashboard/admin/audit-logs", label: "Audit Logs", icon: FileText },
  ];

  const teacherLinks: NavItem[] = [
    { href: "/dashboard/teacher/attendance", label: "Attendance", icon: ClipboardCheck },
    { href: "/dashboard/teacher/attendance/history", label: "Attendance History", icon: History },
  ];

  const studentLinks: NavItem[] = [
    { href: "/dashboard/student/attendance", label: "My Attendance", icon: ClipboardCheck },
    { href: "/dashboard/student/profile", label: "My Profile", icon: UserCircle2 },
  ];

  return (
    <nav className="space-y-2">
      <div className="space-y-1">
        {commonLinks.map((link) => (
          <SidebarLink key={link.href} {...link} />
        ))}
      </div>

      {hasRole(role, [ROLES.SUPER_ADMIN, ROLES.ADMIN]) && (
        <SidebarGroup
          title="Admin"
          icon={Shield}
          items={adminLinks}
        />
      )}

      {hasRole(role, [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER, ROLES.STAFF]) && (
        <SidebarGroup
          title="Teacher"
          icon={School}
          items={teacherLinks}
        />
      )}

      {hasRole(role, [ROLES.STUDENT]) && (
        <SidebarGroup
          title="Student"
          icon={GraduationCap}
          items={studentLinks}
        />
      )}

      <SidebarGroup
        title="Account"
        icon={UserCircle2}
        items={accountLinks}
        defaultOpen
      />
    </nav>
  );
}