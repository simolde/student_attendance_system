"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AnnouncementTarget, Prisma } from "@/../generated/prisma/client";

/* ── Helpers ───────────────────────────────────────── */

function getUserTargets(role: string): AnnouncementTarget[] {
  switch (role) {
    case "TEACHER":
      return [AnnouncementTarget.ALL, AnnouncementTarget.TEACHER];
    case "STUDENT":
      return [AnnouncementTarget.ALL, AnnouncementTarget.STUDENT];
    case "ADMIN":
    case "SUPER_ADMIN":
      return [AnnouncementTarget.ALL, AnnouncementTarget.ADMIN];
    default:
      return [AnnouncementTarget.ALL];
  }
}

/* ── Mark single announcement as read ───────────────── */

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
      update: {},
    });
  } catch {
    // Ignore race condition
  }

  revalidatePath("/dashboard");
}

/* ── Mark all visible announcements as read ─────────── */

export async function markAllAnnouncementsRead() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userTargets = getUserTargets(session.user.role);

  const announcements = await prisma.announcement.findMany({
    where: {
      status: "PUBLISHED",
      targets: {
        hasSome: userTargets, // ✅ FIXED
      },
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

/* ── Fetch announcements with read state ───────────── */

export type AnnouncementReadFilters = {
  q?: string;
  page?: number;
  pageSize?: number;
  userId: string;
  role: string;
};

export async function getAnnouncementsForRole(
  filters: AnnouncementReadFilters
) {
  const { q = "", page = 1, pageSize = 10, userId, role } = filters;

  const userTargets = getUserTargets(role);

  const where: Prisma.AnnouncementWhereInput = {
    AND: [
      { status: "PUBLISHED" },

      {
        targets: {
          hasSome: userTargets, // ✅ FIXED
        },
      },

      ...(q
        ? [
            {
              OR: [
                {
                  title: {
                    contains: q,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
                {
                  content: {
                    contains: q,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
              ],
            },
          ]
        : []),
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

    prisma.announcement.count({
      where: {
        status: "PUBLISHED",
        targets: {
          hasSome: userTargets, // ✅ FIXED
        },
        reads: {
          none: { userId },
        },
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