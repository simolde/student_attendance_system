"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AnnouncementFormState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
};

// ─── Schemas ─────────────────────────────────────────────────────────────────

const announcementSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be 200 characters or fewer"),
  content: z
    .string()
    .min(10, "Content must be at least 10 characters")
    .max(5000, "Content must be 5000 characters or fewer"),
  target: z.enum(["ALL", "TEACHER", "STUDENT", "ADMIN"]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("PUBLISHED"),
  isPinned: z
    .string()
    .optional()
    .transform((v) => v === "on"),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasRole(session.user.role, [ROLES.SUPER_ADMIN, ROLES.ADMIN]))
    redirect("/unauthorized");
  return session;
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

export async function createAnnouncement(
  prevState: AnnouncementFormState,
  formData: FormData
): Promise<AnnouncementFormState> {
  const session = await requireAdmin();

  const raw = {
    title: formData.get("title"),
    content: formData.get("content"),
    target: formData.get("target"),
    status: formData.get("status") ?? "PUBLISHED",
    isPinned: formData.get("isPinned"),
  };

  const parsed = announcementSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const [field, errors] of Object.entries(
      parsed.error.flatten().fieldErrors
    )) {
      fieldErrors[field] = errors[0] ?? "Invalid value";
    }
    return { error: "Please fix the errors below.", fieldErrors };
  }

  try {
    const announcement = await prisma.announcement.create({
      data: {
        title: parsed.data.title.trim(),
        content: parsed.data.content.trim(),
        target: parsed.data.target,
        status: parsed.data.status,
        isPinned: parsed.data.isPinned,
        authorId: session.user.id,
      },
    });

    await logAudit({
      userId: session.user.id,
      action: "CREATE_ANNOUNCEMENT",
      entity: "Announcement",
      entityId: announcement.id,
      description: `Created announcement "${announcement.title}" targeting ${announcement.target}`,
    });

    revalidatePath("/dashboard/admin/announcements");
    revalidatePath("/dashboard/teacher/announcements");
    revalidatePath("/dashboard/student/announcements");
    revalidatePath("/dashboard/announcements");

    return { success: "Announcement created successfully." };
  } catch (error) {
    console.error("createAnnouncement error:", error);
    return { error: "Failed to create announcement. Please try again." };
  }
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

const updateAnnouncementSchema = announcementSchema.extend({
  announcementId: z.string().min(1, "Announcement ID is required"),
});

export async function updateAnnouncement(
  prevState: AnnouncementFormState,
  formData: FormData
): Promise<AnnouncementFormState> {
  const session = await requireAdmin();

  const raw = {
    announcementId: formData.get("announcementId"),
    title: formData.get("title"),
    content: formData.get("content"),
    target: formData.get("target"),
    status: formData.get("status") ?? "PUBLISHED",
    isPinned: formData.get("isPinned"),
  };

  const parsed = updateAnnouncementSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const [field, errors] of Object.entries(
      parsed.error.flatten().fieldErrors
    )) {
      fieldErrors[field] = errors[0] ?? "Invalid value";
    }
    return { error: "Please fix the errors below.", fieldErrors };
  }

  const existing = await prisma.announcement.findUnique({
    where: { id: parsed.data.announcementId },
    select: { id: true },
  });

  if (!existing) return { error: "Announcement not found." };

  try {
    const updated = await prisma.announcement.update({
      where: { id: parsed.data.announcementId },
      data: {
        title: parsed.data.title.trim(),
        content: parsed.data.content.trim(),
        target: parsed.data.target,
        status: parsed.data.status,
        isPinned: parsed.data.isPinned,
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
    revalidatePath("/dashboard/announcements");

    return { success: "Announcement updated successfully." };
  } catch (error) {
    console.error("updateAnnouncement error:", error);
    return { error: "Failed to update announcement. Please try again." };
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function deleteAnnouncement(
  formData: FormData
): Promise<void> {
  const session = await requireAdmin();

  const id = formData.get("announcementId");
  if (typeof id !== "string" || !id) return;

  const existing = await prisma.announcement.findUnique({
    where: { id },
    select: { id: true, title: true },
  });

  if (!existing) return;

  await prisma.announcement.delete({ where: { id } });

  await logAudit({
    userId: session.user.id,
    action: "DELETE_ANNOUNCEMENT",
    entity: "Announcement",
    entityId: id,
    description: `Deleted announcement "${existing.title}"`,
  });

  revalidatePath("/dashboard/admin/announcements");
  revalidatePath("/dashboard/teacher/announcements");
  revalidatePath("/dashboard/student/announcements");
  revalidatePath("/dashboard/announcements");
}

// ─── TOGGLE PIN ───────────────────────────────────────────────────────────────

export async function toggleAnnouncementPin(formData: FormData): Promise<void> {
  const session = await requireAdmin();

  const id = formData.get("announcementId");
  if (typeof id !== "string" || !id) return;

  const existing = await prisma.announcement.findUnique({
    where: { id },
    select: { id: true, isPinned: true, title: true },
  });

  if (!existing) return;

  const updated = await prisma.announcement.update({
    where: { id },
    data: { isPinned: !existing.isPinned },
  });

  await logAudit({
    userId: session.user.id,
    action: updated.isPinned ? "PIN_ANNOUNCEMENT" : "UNPIN_ANNOUNCEMENT",
    entity: "Announcement",
    entityId: id,
    description: `${updated.isPinned ? "Pinned" : "Unpinned"} announcement "${existing.title}"`,
  });

  revalidatePath("/dashboard/admin/announcements");
}

// ─── MARK AS READ ─────────────────────────────────────────────────────────────

export async function markAnnouncementRead(
  announcementId: string
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  await prisma.announcementRead.upsert({
    where: {
      announcementId_userId: {
        announcementId,
        userId: session.user.id,
      },
    },
    update: {},
    create: {
      announcementId,
      userId: session.user.id,
    },
  });
}

// ─── GET UNREAD COUNT (for badge) ────────────────────────────────────────────

export async function getUnreadAnnouncementCount(
  userId: string,
  userRole: string
): Promise<number> {
  const targetFilter = buildTargetFilter(userRole);

  const count = await prisma.announcement.count({
    where: {
      status: "PUBLISHED",
      ...targetFilter,
      reads: {
        none: {
          userId,
        },
      },
    },
  });

  return count;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export async function buildTargetFilter(role: string) {
  if (role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN) {
    return {}; // admins see everything
  }
  if (role === ROLES.TEACHER) {
    return { target: { in: ["ALL", "TEACHER"] as const } };
  }
  if (role === ROLES.STUDENT) {
    return { target: { in: ["ALL", "STUDENT"] as const } };
  }
  return { target: { in: ["ALL"] as const } };
}
