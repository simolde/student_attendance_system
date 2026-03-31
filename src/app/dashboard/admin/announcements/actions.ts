"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

export type AnnouncementFormState = {
  error?: string;
  success?: string;
};

const announcementSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  content: z.string().min(1, "Content is required").max(5000, "Content too long"),
  target: z.enum(["ALL", "TEACHER", "STUDENT", "ADMIN"]).default("ALL"),
  isPinned: z.boolean().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("PUBLISHED"),
});

const updateAnnouncementSchema = announcementSchema.extend({
  id: z.string().min(1, "ID is required"),
});

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasRole(session.user.role, [ROLES.SUPER_ADMIN, ROLES.ADMIN])) {
    redirect("/unauthorized");
  }
  return session;
}

// ── Fetch with search + pagination ────────────────────────────────────────────

export type AnnouncementFilters = {
  q?: string;
  target?: string;
  status?: string;
  page?: number;
  pageSize?: number;
};

export async function getAnnouncements(filters: AnnouncementFilters = {}) {
  const {
    q = "",
    target = "",
    status = "",
    page = 1,
    pageSize = 10,
  } = filters;

  const where = {
    AND: [
      target ? { target: target as "ALL" | "TEACHER" | "STUDENT" | "ADMIN" } : {},
      status
        ? { status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED" }
        : {},
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

  const [totalCount, announcements] = await Promise.all([
    prisma.announcement.count({ where }),
    prisma.announcement.findMany({
      where,
      include: {
        author: {
          select: { name: true, email: true },
        },
        _count: {
          select: { reads: true },
        },
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    announcements,
    totalCount,
    totalPages: Math.max(Math.ceil(totalCount / pageSize), 1),
    page,
    pageSize,
  };
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createAnnouncement(
  prevState: AnnouncementFormState,
  formData: FormData
): Promise<AnnouncementFormState> {
  const session = await requireAdmin();

  const parsed = announcementSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    target: formData.get("target") || "ALL",
    isPinned: formData.get("isPinned") === "on",
    status: formData.get("status") || "PUBLISHED",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid data" };
  }

  const { title, content, target, isPinned, status } = parsed.data;

  try {
    const created = await prisma.announcement.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        target,
        isPinned: isPinned,
        status,
        authorId: session.user.id,
      },
    });

    await logAudit({
      userId: session.user.id,
      action: "CREATE_ANNOUNCEMENT",
      entity: "Announcement",
      entityId: created.id,
      description: `Created announcement "${created.title}"`,
    });

    revalidatePath("/dashboard/admin/announcements");
    revalidatePath("/dashboard/teacher/announcements");
    revalidatePath("/dashboard/student/announcements");

    return { success: "Announcement created successfully" };
  } catch (error) {
    console.error(error);
    return { error: "Failed to create announcement" };
  }
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateAnnouncement(
  prevState: AnnouncementFormState,
  formData: FormData
): Promise<AnnouncementFormState> {
  const session = await requireAdmin();

  const parsed = updateAnnouncementSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    content: formData.get("content"),
    target: formData.get("target") || "ALL",
    isPinned: formData.get("isPinned") === "on",
    status: formData.get("status") || "PUBLISHED",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid data" };
  }

  const { id, title, content, target, isPinned, status } = parsed.data;

  try {
    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        title: title.trim(),
        content: content.trim(),
        target,
        isPinned: isPinned,
        status,
      },
    });

    await logAudit({
      userId: session.user.id,
      action: "UPDATE_ANNOUNCEMENT",
      entity: "Announcement",
      entityId: updated.id,
      description: `Updated announcement "${updated.title}"`,
    });

    revalidatePath("/dashboard/admin/announcements");
    revalidatePath("/dashboard/teacher/announcements");
    revalidatePath("/dashboard/student/announcements");

    return { success: "Announcement updated successfully" };
  } catch (error) {
    console.error(error);
    return { error: "Failed to update announcement" };
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteAnnouncement(formData: FormData) {
  const session = await requireAdmin();

  const id = formData.get("id") as string;
  if (!id) throw new Error("ID is required");

  const announcement = await prisma.announcement.findUnique({
    where: { id },
    select: { id: true, title: true },
  });

  if (!announcement) throw new Error("Announcement not found");

  await prisma.announcement.delete({ where: { id } });

  await logAudit({
    userId: session.user.id,
    action: "DELETE_ANNOUNCEMENT",
    entity: "Announcement",
    entityId: id,
    description: `Deleted announcement "${announcement.title}"`,
  });

  revalidatePath("/dashboard/admin/announcements");
  revalidatePath("/dashboard/teacher/announcements");
  revalidatePath("/dashboard/student/announcements");
}

// ── Toggle Pin ────────────────────────────────────────────────────────────────

export async function toggleAnnouncementPin(formData: FormData) {
  const session = await requireAdmin();

  const id = formData.get("id") as string;
  if (!id) throw new Error("ID is required");

  const announcement = await prisma.announcement.findUnique({
    where: { id },
    select: { id: true, isPinned: true, title: true },
  });

  if (!announcement) throw new Error("Announcement not found");

  await prisma.announcement.update({
    where: { id },
    data: { isPinned: !announcement.isPinned },
  });

  await logAudit({
    userId: session.user.id,
    action: announcement.isPinned ? "UNPIN_ANNOUNCEMENT" : "PIN_ANNOUNCEMENT",
    entity: "Announcement",
    entityId: id,
    description: `${announcement.isPinned ? "Unpinned" : "Pinned"} announcement "${announcement.title}"`,
  });

  revalidatePath("/dashboard/admin/announcements");
}
