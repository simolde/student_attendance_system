"use client";

import Link from "next/link";
import { LogOut, KeyRound, UserCircle2, ChevronsUpDown } from "lucide-react";
import { signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function DashboardUserMenu({
  userName,
  userEmail,
  role,
  imageUrl,
  collapsed = false,
}: {
  userName: string;
  userEmail: string;
  role: string;
  imageUrl?: string | null;
  collapsed?: boolean;
}) {
  const initials = getInitials(userName || userEmail || "U");
  console.log(imageUrl);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center rounded-2xl transition hover:bg-white/5",
            collapsed
              ? "justify-center px-2 py-2.5"
              : "gap-3 px-2 py-2.5 text-left"
          )}
        >
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={imageUrl ?? undefined} alt={userName} />
            <AvatarFallback className="bg-white/10 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>

          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {userName}
                </p>
                <p className="truncate text-xs text-slate-400">
                  {userEmail}
                </p>
              </div>

              <ChevronsUpDown className="h-4 w-4 text-slate-400" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        side="top"
        sideOffset={8}
        className="w-64 rounded-xl p-0"
      >
        <div className="flex items-center gap-3 px-3 py-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={imageUrl ?? undefined} alt={userName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{userName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {userEmail}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{role}</p>
          </div>
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
  );
}