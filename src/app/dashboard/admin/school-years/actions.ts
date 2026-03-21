"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

export type SchoolYearFormState = {
  error?: string;
  success?: string;
};

const createSchoolYearSchema = z.object({
  name: z.string().min(1, "School year name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  isActive: z.string().optional(),
});

const activateSchoolYearSchema = z.object({
  schoolYearId: z.string().min(1, "School year is required"),
});

async function requireAdmin() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasRole(session.user.role, [ROLES.SUPER_ADMIN, ROLES.ADMIN])) {
    redirect("/unauthorized");
  }

  return session;
}

export async function createSchoolYear(
  prevState: SchoolYearFormState,
  formData: FormData
): Promise<SchoolYearFormState> {
  const session = await requireAdmin();

  const parsed = createSchoolYearSchema.safeParse({
    name: formData.get("name"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    isActive: formData.get("isActive"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Invalid school year data",
    };
  }

  const { name, startDate, endDate, isActive } = parsed.data;

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T23:59:59`);

  if (start >= end) {
    return { error: "Start date must be earlier than end date" };
  }

  try {
    const existing = await prisma.schoolYear.findUnique({
      where: { name },
      select: { id: true },
    });

    if (existing) {
      return { error: "School year already exists" };
    }

    if (isActive === "on") {
      await prisma.schoolYear.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    const created = await prisma.schoolYear.create({
      data: {
        name,
        startDate: start,
        endDate: end,
        isActive: isActive === "on",
      },
    });

    await logAudit({
      userId: session.user.id,
      action: "CREATE_SCHOOL_YEAR",
      entity: "SchoolYear",
      entityId: created.id,
      description: `Created school year ${created.name}`,
    });

    revalidatePath("/dashboard/admin/school-years");

    return { success: "School year created successfully" };
  } catch (error) {
    console.error(error);
    return { error: "Failed to create school year" };
  }
}

export async function activateSchoolYear(formData: FormData) {
  const session = await requireAdmin();

  const parsed = activateSchoolYearSchema.safeParse({
    schoolYearId: formData.get("schoolYearId"),
  });

  if (!parsed.success) {
    throw new Error("Invalid school year");
  }

  const { schoolYearId } = parsed.data;

  await prisma.$transaction(async (tx) => {
    await tx.schoolYear.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    await tx.schoolYear.update({
      where: { id: schoolYearId },
      data: { isActive: true },
    });
  });

  await logAudit({
    userId: session.user.id,
    action: "ACTIVATE_SCHOOL_YEAR",
    entity: "SchoolYear",
    entityId: schoolYearId,
    description: `Activated school year`,
  });

  revalidatePath("/dashboard/admin/school-years");
}