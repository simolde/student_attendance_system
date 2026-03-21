"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

export type AttendanceUpdateState = {
  error?: string;
  success?: string;
};

const updateSchema = z.object({
  attendanceId: z.string().min(1),
  status: z.enum(["PRESENT", "LATE", "ABSENT", "EXCUSED"]),
  remarks: z.string().optional(),
});

const deleteSchema = z.object({
  attendanceId: z.string().min(1),
});

async function requireTeacherAccess() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (
    !hasRole(session.user.role, [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.TEACHER,
      ROLES.STAFF,
    ])
  ) {
    redirect("/unauthorized");
  }

  return session;
}

export async function updateAttendanceRecord(
  prevState: AttendanceUpdateState,
  formData: FormData
): Promise<AttendanceUpdateState> {
  const session = await requireTeacherAccess();

  const parsed = updateSchema.safeParse({
    attendanceId: formData.get("attendanceId"),
    status: formData.get("status"),
    remarks: formData.get("remarks"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid update data" };
  }

  try {
    const updated = await prisma.attendance.update({
      where: { id: parsed.data.attendanceId },
      data: {
        status: parsed.data.status,
        remarks:
          parsed.data.remarks && parsed.data.remarks.trim().length > 0
            ? parsed.data.remarks.trim()
            : null,
      },
    });

    await logAudit({
      userId: session.user.id,
      action: "UPDATE_ATTENDANCE",
      entity: "Attendance",
      entityId: updated.id,
      description: `Updated attendance ${updated.id} to ${updated.status}`,
    });

    revalidatePath("/dashboard/teacher/attendance/history");
    revalidatePath("/dashboard");

    return { success: "Attendance updated successfully" };
  } catch (error) {
    console.error(error);
    return { error: "Failed to update attendance" };
  }
}

export async function deleteAttendanceRecord(
  prevState: AttendanceUpdateState,
  formData: FormData
): Promise<AttendanceUpdateState> {
  const session = await requireTeacherAccess();

  const parsed = deleteSchema.safeParse({
    attendanceId: formData.get("attendanceId"),
  });

  if (!parsed.success) {
    return { error: "Invalid attendance record" };
  }

  try {
    const deleted = await prisma.attendance.delete({
      where: { id: parsed.data.attendanceId },
    });

    await logAudit({
      userId: session.user.id,
      action: "DELETE_ATTENDANCE",
      entity: "Attendance",
      entityId: deleted.id,
      description: `Deleted attendance ${deleted.id}`,
    });

    revalidatePath("/dashboard/teacher/attendance/history");
    revalidatePath("/dashboard");

    return { success: "Attendance deleted successfully" };
  } catch (error) {
    console.error(error);
    return { error: "Failed to delete attendance" };
  }
}