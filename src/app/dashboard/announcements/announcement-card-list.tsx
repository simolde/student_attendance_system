"use client";

import { Bell, Pin, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { markAllAnnouncementsRead } from "./shared-actions";
import { Button } from "@/components/ui/button";

type AnnouncementItem = {
  id: string;
  title: string;
  content: string;
  target: string;
  isPinned: boolean;
  status: string;
  isRead: boolean;
  createdAt: Date;
  author: { name: string | null; email: string } | null;
};

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function getTargetBadgeClass(target: string) {
  switch (target) {
    case "ALL":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "TEACHER":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "STUDENT":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "ADMIN":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export default function AnnouncementCardList({
  announcements,
  unreadCount,
}: {
  announcements: AnnouncementItem[];
  unreadCount: number;
}) {
  if (announcements.length === 0) {
    return (
      <div className="portal-card-soft flex min-h-55 items-center justify-center p-8 text-center">
        <div className="space-y-2">
          <Bell className="mx-auto h-10 w-10 text-slate-300" />
          <p className="text-base font-semibold text-slate-900">
            No announcements found
          </p>
          <p className="text-sm text-slate-600">
            Check back later for new school notices.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mark all read button */}
      {unreadCount > 0 && (
        <form action={markAllAnnouncementsRead} className="flex justify-end">
          <Button type="submit" variant="outline" size="sm" className="gap-2 rounded-xl">
            <CheckCheck className="h-4 w-4" />
            Mark all as read ({unreadCount})
          </Button>
        </form>
      )}

      {announcements.map((ann) => (
        <div
          key={ann.id}
          className={cn(
            "portal-card p-5 transition-all",
            !ann.isRead && "ring-2 ring-blue-100"
          )}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 space-y-2">
              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-2">
                {ann.isPinned && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                    <Pin className="h-3 w-3" />
                    Pinned
                  </span>
                )}
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getTargetBadgeClass(
                    ann.target
                  )}`}
                >
                  {ann.target === "ALL" ? "All Users" : ann.target}
                </span>
                {!ann.isRead && (
                  <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                    New
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                {ann.title}
              </h3>

              {/* Content */}
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {ann.content}
              </p>
            </div>

            {/* Date + author */}
            <div className="shrink-0 space-y-1 text-right text-xs text-slate-500 md:text-right">
              <div>{formatDateTime(ann.createdAt)}</div>
              {ann.author && (
                <div className="text-slate-400">
                  by {ann.author.name ?? ann.author.email}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
