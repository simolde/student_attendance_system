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

const updateAttendanceSchema = z.object({
  attendanceId: z.string().min(1, "Attendance ID is required"),
  status: z.enum(["PRESENT", "LATE", "ABSENT", "EXCUSED"]),
  remarks: z.string().optional(),
});

async function requireAttendanceAccess() {
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
  const session = await requireAttendanceAccess();

  const parsed = updateAttendanceSchema.safeParse({
    attendanceId: formData.get("attendanceId"),
    status: formData.get("status"),
    remarks: formData.get("remarks")?.toString() ?? "",
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Invalid attendance update",
    };
  }

  const { attendanceId, status, remarks } = parsed.data;

  try {
    const updated = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        status,
        remarks: remarks || null,
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    await logAudit({
      userId: session.user.id,
      action: "UPDATE_ATTENDANCE",
      entity: "Attendance",
      entityId: updated.id,
      description: `Updated attendance for ${updated.student.user.email} to ${status}`,
    });

    revalidatePath("/dashboard/teacher/attendance/history");

    return { success: "Attendance updated successfully" };
  } catch {
    return { error: "Failed to update attendance" };
  }
}