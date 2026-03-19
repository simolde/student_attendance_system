"use client";

import Link from "next/link";
import { Menu, User, KeyRound, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import DashboardSidebarNav from "./dashboard-sidebar-nav";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function DashboardNavbar({
  userName,
  userEmail,
  role,
}: {
  userName: string;
  userEmail: string;
  role: string;
}) {
  const initials = getInitials(userName || userEmail || "U");

  return (
    <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="w-72 p-0">
              <div className="border-b px-4 py-4">
                <Link href="/dashboard" className="text-lg font-bold">
                  Student Attendance
                </Link>
                <p className="mt-1 text-xs text-muted-foreground">
                  Management System
                </p>
              </div>

              <div className="p-3">
                <DashboardSidebarNav role={role} />
              </div>
            </SheetContent>
          </Sheet>

          <div>
            <Link href="/dashboard" className="text-lg font-bold tracking-tight">
              Student Attendance
            </Link>
            <p className="hidden text-xs text-muted-foreground md:block">
              Management System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right md:block">
            <p className="text-sm font-medium leading-none">{userName}</p>
            <p className="mt-1 text-xs text-muted-foreground">{role}</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full outline-none ring-offset-2 transition focus-visible:ring-2">
                <Avatar className="h-10 w-10 border">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link href="/dashboard/account" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  My Account
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link
                  href="/dashboard/change-password"
                  className="cursor-pointer"
                >
                  <KeyRound className="mr-2 h-4 w-4" />
                  Change Password
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="cursor-pointer text-red-600 focus:text-red-600"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}