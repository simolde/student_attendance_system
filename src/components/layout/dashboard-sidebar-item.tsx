"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type IconType = React.ComponentType<{ className?: string }>;

export function SidebarSectionLabel({
  label,
  collapsed,
}: {
  label: string;
  collapsed: boolean;
}) {
  if (collapsed) {
    return <div className="h-3" />;
  }

  return (
    <p className="px-3 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
      {label}
    </p>
  );
}

export function SidebarItem({
  href,
  label,
  icon: Icon,
  collapsed,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: IconType;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={cn(
        "group flex items-center rounded-xl transition-all",
        collapsed
          ? "justify-center px-2 py-3"
          : "gap-3 px-3 py-3",
        active
          ? "bg-slate-800 text-white"
          : "text-slate-300 hover:bg-white/5 hover:text-white"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate text-sm font-medium">{label}</span>}
    </Link>
  );
}