"use server";

import { auth } from "@/auth";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

export type AttendanceUpdateState = {
  error?: string;
  success?: string;
};

const updateAttendanceSchema = z.object({
  attendanceId: z.string().min(1, "Attendance ID is required"),
  status: z.enum(["PRESENT", "LATE", "ABSENT", "EXCUSED"]),
  remarks: z.string().optional(),
});

const deleteAttendanceSchema = z.object({
  attendanceId: z.string().min(1, "Attendance ID is required"),
});

async function ensureAuthorized() {
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
  const session = await ensureAuthorized();

  const parsed = updateAttendanceSchema.safeParse({
    attendanceId: formData.get("attendanceId"),
    status: formData.get("status"),
    remarks: formData.get("remarks") ?? "",
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Invalid attendance data",
    };
  }

  const { attendanceId, status, remarks } = parsed.data;

  try {
    const existing = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: {
        student: {
          select: {
            studentNo: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!existing) {
      return { error: "Attendance record not found" };
    }

    await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        status,
        remarks: remarks && remarks.trim().length > 0 ? remarks.trim() : null,
      },
    });

    await logAudit({
      userId: session.user.id,
      action: "UPDATE_ATTENDANCE",
      entity: "Attendance",
      entityId: attendanceId,
      description: `Updated attendance for ${existing.student.studentNo} (${existing.student.user.name ?? existing.student.user.email})`,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/teacher/attendance");
    revalidatePath("/dashboard/teacher/attendance/history");

    return { success: "Attendance updated successfully" };
  } catch (error) {
    console.error("Update attendance failed:", error);
    return { error: "Failed to update attendance" };
  }
}

export async function deleteAttendanceRecord(
  prevState: AttendanceUpdateState,
  formData: FormData
): Promise<AttendanceUpdateState> {
  const session = await ensureAuthorized();

  const parsed = deleteAttendanceSchema.safeParse({
    attendanceId: formData.get("attendanceId"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Invalid attendance ID",
    };
  }

  const { attendanceId } = parsed.data;

  try {
    const existing = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: {
        student: {
          select: {
            studentNo: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!existing) {
      return { error: "Attendance record not found" };
    }

    await prisma.attendance.delete({
      where: { id: attendanceId },
    });

    await logAudit({
      userId: session.user.id,
      action: "DELETE_ATTENDANCE",
      entity: "Attendance",
      entityId: attendanceId,
      description: `Deleted attendance for ${existing.student.studentNo} (${existing.student.user.name ?? existing.student.user.email})`,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/teacher/attendance");
    revalidatePath("/dashboard/teacher/attendance/history");

    return { success: "Attendance deleted successfully" };
  } catch (error) {
    console.error("Delete attendance failed:", error);
    return { error: "Failed to delete attendance" };
  }
}