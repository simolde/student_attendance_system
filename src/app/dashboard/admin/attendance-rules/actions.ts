"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

export type AttendanceRuleFormState = {
  error?: string;
  success?: string;
};

const gradeLevelValues = [
  "PRE_NURSERY",
  "NURSERY",
  "KINDER",
  "GRADE_1",
  "GRADE_2",
  "GRADE_3",
  "GRADE_4",
  "GRADE_5",
  "GRADE_6",
  "GRADE_7",
  "GRADE_8",
  "GRADE_9",
  "GRADE_10",
  "GRADE_11",
  "GRADE_12",
] as const;

const ruleSchema = z.object({
  name: z.string().min(1, "Rule name is required"),
  gradeLevel: z.string().optional(),
  sectionId: z.string().optional(),
  isDefault: z.string().optional(),
  timeInStart: z.string().min(1, "Time in start is required"),
  timeInEnd: z.string().min(1, "Time in end is required"),
  lateAfter: z.string().min(1, "Late cutoff is required"),
  timeOutStart: z.string().optional(),
  timeOutEnd: z.string().optional(),
});

const activateSchema = z.object({
  ruleId: z.string().min(1, "Rule is required"),
});

function isValidTimeRange(start: string, end: string) {
  return start < end;
}

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

export async function createAttendanceRule(
  prevState: AttendanceRuleFormState,
  formData: FormData
): Promise<AttendanceRuleFormState> {
  const session = await requireAdmin();

  const parsed = ruleSchema.safeParse({
    name: formData.get("name"),
    gradeLevel: formData.get("gradeLevel"),
    sectionId: formData.get("sectionId"),
    isDefault: formData.get("isDefault"),
    timeInStart: formData.get("timeInStart"),
    timeInEnd: formData.get("timeInEnd"),
    lateAfter: formData.get("lateAfter"),
    timeOutStart: formData.get("timeOutStart"),
    timeOutEnd: formData.get("timeOutEnd"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Invalid attendance rule",
    };
  }

  const {
    name,
    gradeLevel,
    sectionId,
    isDefault,
    timeInStart,
    timeInEnd,
    lateAfter,
    timeOutStart,
    timeOutEnd,
  } = parsed.data;

  if (!isValidTimeRange(timeInStart, timeInEnd)) {
    return { error: "Time in start must be earlier than time in end" };
  }

  if (!(timeInStart <= lateAfter && lateAfter <= timeInEnd)) {
    return { error: "Late cutoff must be between time in start and time in end" };
  }

  if (timeOutStart && timeOutEnd && !isValidTimeRange(timeOutStart, timeOutEnd)) {
    return { error: "Time out start must be earlier than time out end" };
  }

  const normalizedGradeLevel =
    gradeLevel && gradeLevelValues.includes(gradeLevel as (typeof gradeLevelValues)[number])
      ? (gradeLevel as (typeof gradeLevelValues)[number])
      : null;

  const normalizedSectionId = sectionId?.trim() ? sectionId.trim() : null;
  const normalizedIsDefault = isDefault === "on";

  if (!normalizedIsDefault && !normalizedGradeLevel && !normalizedSectionId) {
    return {
      error: "Select a grade level, a section, or mark the rule as default",
    };
  }

  if (normalizedIsDefault && (normalizedGradeLevel || normalizedSectionId)) {
    return {
      error: "Default rule cannot also target a grade level or section",
    };
  }

  try {
    const existing = await prisma.attendanceRule.findUnique({
      where: { name: name.trim() },
      select: { id: true },
    });

    if (existing) {
      return { error: "Rule name already exists" };
    }

    const created = await prisma.attendanceRule.create({
      data: {
        name: name.trim(),
        gradeLevel: normalizedGradeLevel,
        sectionId: normalizedSectionId,
        isDefault: normalizedIsDefault,
        isActive: true,
        timeInStart,
        timeInEnd,
        lateAfter,
        timeOutStart: timeOutStart?.trim() || null,
        timeOutEnd: timeOutEnd?.trim() || null,
      },
    });

    await logAudit({
      userId: session.user.id,
      action: "CREATE_ATTENDANCE_RULE",
      entity: "AttendanceRule",
      entityId: created.id,
      description: `Created attendance rule ${created.name}`,
    });

    revalidatePath("/dashboard/admin/attendance-rules");

    return { success: "Attendance rule created successfully" };
  } catch (error) {
    console.error(error);
    return { error: "Failed to create attendance rule" };
  }
}

export async function toggleAttendanceRuleActive(formData: FormData) {
  const session = await requireAdmin();

  const parsed = activateSchema.safeParse({
    ruleId: formData.get("ruleId"),
  });

  if (!parsed.success) {
    throw new Error("Invalid rule");
  }

  const rule = await prisma.attendanceRule.findUnique({
    where: { id: parsed.data.ruleId },
    select: {
      id: true,
      name: true,
      isActive: true,
    },
  });

  if (!rule) {
    throw new Error("Rule not found");
  }

  const updated = await prisma.attendanceRule.update({
    where: { id: rule.id },
    data: { isActive: !rule.isActive },
  });

  await logAudit({
    userId: session.user.id,
    action: updated.isActive ? "ACTIVATE_ATTENDANCE_RULE" : "DEACTIVATE_ATTENDANCE_RULE",
    entity: "AttendanceRule",
    entityId: updated.id,
    description: `${updated.isActive ? "Activated" : "Deactivated"} attendance rule ${updated.name}`,
  });

  revalidatePath("/dashboard/admin/attendance-rules");
}