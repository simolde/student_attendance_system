"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  LogOut,
  School,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { hasRole, ROLES } from "@/lib/rbac";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function AppSidebar({
  role,
  userName,
  userEmail,
}: {
  role: string;
  userName: string;
  userEmail: string;
}) {
  const pathname = usePathname();

  const dashboardLinks: NavItem[] = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
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
    { href: "/dashboard/change-password", label: "Change Password", icon: KeyRound },
  ];

  function renderGroup(title: string, items: NavItem[]) {
    if (!items.length) return null;

    return (
      <SidebarGroup>
        <SidebarGroupLabel className="px-2 text-[11px] uppercase tracking-[0.18em] text-slate-400">
          {title}
        </SidebarGroupLabel>

        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    size="lg"
                    className="h-11 rounded-xl px-3 data-[active=true]:bg-slate-800 data-[active=true]:text-white hover:bg-slate-800/70 hover:text-white"
                  >
                    <Link href={item.href}>
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <Sidebar
      collapsible="offcanvas"
      className="border-r-0"
      style={
        {
          "--sidebar-width": "18rem",
          "--sidebar-width-mobile": "18rem",
        } as React.CSSProperties
      }
    >
      <div className="flex h-full flex-col bg-[#0f172a] text-white">
        <SidebarHeader className="border-b border-white/10">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <Shield className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Student Attendance</p>
              <p className="truncate text-xs text-slate-400">Management System</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2 py-3">
          {renderGroup("Dashboard", dashboardLinks)}
          {renderGroup("Admin", adminLinks)}
          {renderGroup("Teacher", teacherLinks)}
          {renderGroup("Student", studentLinks)}
          {renderGroup("Account", accountLinks)}
        </SidebarContent>

        <SidebarFooter className="border-t border-white/10 p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-white/5">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-white/10 text-white">
                    {getInitials(userName || userEmail || "U")}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {userName}
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {userEmail}
                  </p>
                </div>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent side="top" align="start" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
                <p className="mt-1 text-xs text-muted-foreground">{role}</p>
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link href="/dashboard/account">
                  <UserCircle2 className="mr-2 h-4 w-4" />
                  My Account
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/dashboard/change-password">
                  <KeyRound className="mr-2 h-4 w-4" />
                  Change Password
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}