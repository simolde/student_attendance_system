"use client";

import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ClipboardCheck,
  History,
  UserCircle2,
  KeyRound,
  FileText,
  Shield,
  School,
  FileSpreadsheet,
  Radio,
} from "lucide-react";
import { hasRole, ROLES } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import { useDashboardLayout } from "./dashboard-context";
import DashboardUserMenu from "./dashboard-user-menu";
import { SidebarItem, SidebarSectionLabel } from "./dashboard-sidebar-item";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

function SidebarContent({
  role,
  collapsed,
  onNavigate,
}: {
  role: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const dashboardLinks: NavItem[] = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  ];

  const adminLinks: NavItem[] = hasRole(role, [ROLES.SUPER_ADMIN, ROLES.ADMIN])
    ? [
        { href: "/dashboard/admin/users", label: "User Management", icon: Users },
        { href: "/dashboard/admin/students", label: "Student Management", icon: GraduationCap },
        { href: "/dashboard/admin/audit-logs", label: "Audit Logs", icon: FileText },
        { href: "/dashboard/admin/school-years", label: "School Years", icon: School },
        { href: "/dashboard/admin/students/import", label: "Import Students", icon: FileSpreadsheet },
        { href: "/dashboard/admin/rfid-logs", label: "RFID Logs", icon: Radio },
      ]
    : [];

  const teacherLinks: NavItem[] = hasRole(role, [
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.TEACHER,
    ROLES.STAFF,
  ])
    ? [
        { href: "/dashboard/teacher/attendance", label: "Attendance", icon: ClipboardCheck },
        { href: "/dashboard/teacher/attendance/history", label: "Attendance History", icon: History },
      ]
    : [];

  const studentLinks: NavItem[] = hasRole(role, [ROLES.STUDENT])
    ? [
        { href: "/dashboard/student/attendance", label: "My Attendance", icon: ClipboardCheck },
        { href: "/dashboard/student/profile", label: "My Profile", icon: UserCircle2 },
      ]
    : [];

  const accountLinks: NavItem[] = [
    { href: "/dashboard/account", label: "My Account", icon: UserCircle2 },
    { href: "/dashboard/change-password", label: "Change Password", icon: KeyRound },
  ];

  const groups = [
    { label: "Dashboard", items: dashboardLinks },
    { label: "Admin", items: adminLinks },
    { label: "Teacher", items: teacherLinks },
    { label: "Student", items: studentLinks },
    { label: "Account", items: accountLinks },
  ];

  return (
    <>
      <div className="border-b border-white/10 px-3 py-4">
        <div
          className={cn(
            "flex items-center",
            collapsed ? "justify-center" : "gap-3"
          )}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <Shield className="h-5 w-5 text-white" />
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                Student Attendance
              </p>
              <p className="truncate text-xs text-slate-400">
                Management System
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        {groups.map((group) =>
          group.items.length > 0 ? (
            <div key={group.label} className="space-y-1">
              <SidebarSectionLabel label={group.label} collapsed={collapsed} />
              {group.items.map((item) => (
                <SidebarItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          ) : null
        )}
      </div>
    </>
  );
}

export default function DashboardSidebar({
  role,
  userName,
  userEmail,
  userImage,
}: {
  role: string;
  userName: string;
  userEmail: string;
  userImage: string | null;
}) {
  const { collapsed, mobileOpen, setMobileOpen } = useDashboardLayout();

  return (
    <>
      <aside
        className={cn(
          "hidden border-r border-white/10 bg-[#0f172a] md:sticky md:top-0 md:flex md:h-screen md:flex-col",
          collapsed ? "md:w-20" : "md:w-72"
        )}
      >
        <SidebarContent role={role} collapsed={collapsed} />

        <div className="border-t border-white/10 p-2">
          <DashboardUserMenu
            userName={userName}
            userEmail={userEmail}
            role={role}
            imageUrl={userImage}
            collapsed={collapsed}
          />
        </div>
      </aside>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMobileOpen(false)}
          />

          <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-[#0f172a] md:hidden">
            <SidebarContent
              role={role}
              collapsed={false}
              onNavigate={() => setMobileOpen(false)}
            />

            <div className="border-t border-white/10 p-2">
              <DashboardUserMenu
                userName={userName}
                userEmail={userEmail}
                role={role}
                imageUrl={userImage}
              />
            </div>
          </aside>
        </>
      )}
    </>
  );
}