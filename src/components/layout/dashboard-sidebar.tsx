import Link from "next/link";
import { hasRole, ROLES } from "@/lib/rbac";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
};

export default function DashboardSidebar({
  role,
  pathname,
}: {
  role: string;
  pathname: string;
}) {
  const commonLinks: NavItem[] = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/account", label: "My Account" },
    { href: "/dashboard/change-password", label: "Change Password" },
  ];

  const adminLinks: NavItem[] = [
    { href: "/dashboard/admin", label: "Admin Dashboard" },
    { href: "/dashboard/admin/users", label: "User Management" },
    { href: "/dashboard/admin/students", label: "Student Management" },
    { href: "/dashboard/admin/audit-logs", label: "Audit Logs" },
  ];

  const teacherLinks: NavItem[] = [
    { href: "/dashboard/teacher", label: "Teacher Dashboard" },
    { href: "/dashboard/teacher/attendance", label: "Record Attendance" },
    { href: "/dashboard/teacher/attendance/history", label: "Attendance History" },
  ];

  const studentLinks: NavItem[] = [
    { href: "/dashboard/student", label: "Student Dashboard" },
    { href: "/dashboard/student/attendance", label: "My Attendance" },
    { href: "/dashboard/student/profile", label: "My Profile" },
  ];

  const links: NavItem[] = [...commonLinks];

  if (hasRole(role, [ROLES.SUPER_ADMIN, ROLES.ADMIN])) {
    links.push(...adminLinks);
  }

  if (hasRole(role, [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER, ROLES.STAFF])) {
    links.push(...teacherLinks);
  }

  if (hasRole(role, [ROLES.STUDENT])) {
    links.push(...studentLinks);
  }

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-background md:block">
      <div className="p-4">
        <p className="mb-4 text-sm font-semibold text-muted-foreground">
          Navigation
        </p>

        <nav className="flex flex-col gap-1">
          {links.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm transition hover:bg-accent hover:text-accent-foreground",
                  isActive && "bg-accent font-medium text-accent-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}