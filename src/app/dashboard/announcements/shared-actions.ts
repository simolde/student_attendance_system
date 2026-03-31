"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// ── Mark single announcement as read ─────────────────────────────────────────

export async function markAnnouncementRead(announcementId: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  try {
    await prisma.announcementRead.upsert({
      where: {
        announcementId_userId: {
          announcementId,
          userId: session.user.id,
        },
      },
      create: {
        announcementId,
        userId: session.user.id,
      },
      update: {}, // already read, no-op
    });
  } catch {
    // Silently ignore (race condition upsert)
  }

  revalidatePath("/dashboard");
}

// ── Mark all visible announcements as read ────────────────────────────────────

export async function markAllAnnouncementsRead(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;

  const announcements = await prisma.announcement.findMany({
    where: {
      status: "PUBLISHED",
      target: { in: ["ALL", role as "ALL" | "TEACHER" | "STUDENT" | "ADMIN"] },
    },
    select: { id: true },
  });

  await Promise.allSettled(
    announcements.map((a) =>
      prisma.announcementRead.upsert({
        where: {
          announcementId_userId: {
            announcementId: a.id,
            userId: session.user.id,
          },
        },
        create: {
          announcementId: a.id,
          userId: session.user.id,
        },
        update: {},
      })
    )
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/teacher/announcements");
  revalidatePath("/dashboard/student/announcements");
}

// ── Fetch announcements for a given role with read status ─────────────────────

export type AnnouncementReadFilters = {
  q?: string;
  page?: number;
  pageSize?: number;
  userId: string;
  role: string;
};

export async function getAnnouncementsForRole(filters: AnnouncementReadFilters) {
  const { q = "", page = 1, pageSize = 10, userId, role } = filters;

  const targetFilter = {
    in: ["ALL", role] as ("ALL" | "TEACHER" | "STUDENT" | "ADMIN")[],
  };

  const where = {
    AND: [
      { status: "PUBLISHED" as const },
      { target: targetFilter },
      q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" as const } },
              { content: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {},
    ],
  };

  const [totalCount, announcements, unreadCount] = await Promise.all([
    prisma.announcement.count({ where }),
    prisma.announcement.findMany({
      where,
      include: {
        author: { select: { name: true, email: true } },
        reads: {
          where: { userId },
          select: { id: true },
        },
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    // unread count (across ALL pages)
    prisma.announcement.count({
      where: {
        status: "PUBLISHED",
        target: targetFilter,
        reads: { none: { userId } },
      },
    }),
  ]);

  return {
    announcements: announcements.map((a) => ({
      ...a,
      isRead: a.reads.length > 0,
    })),
    totalCount,
    totalPages: Math.max(Math.ceil(totalCount / pageSize), 1),
    page,
    unreadCount,
  };
}
