"use client";

import Link from "next/link";
import { Menu, PanelLeft, PanelLeftClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardLayout } from "./dashboard-context";

export default function DashboardNavbar() {
  const { collapsed, setCollapsed, setMobileOpen } = useDashboardLayout();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-white px-4 md:px-6">
      <Button
        variant="outline"
        size="icon"
        className="md:hidden"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="hidden md:inline-flex"
        onClick={() => setCollapsed((prev) => !prev)}
      >
        {collapsed ? (
          <PanelLeft className="h-5 w-5" />
        ) : (
          <PanelLeftClose className="h-5 w-5" />
        )}
      </Button>

      <Link href="/dashboard" className="text-base font-semibold text-slate-900">
        Student Attendance System
      </Link>
    </header>
  );
}