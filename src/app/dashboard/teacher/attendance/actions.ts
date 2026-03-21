"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

export type AttendanceFormState = {
  error?: string;
  success?: string;
};

const attendanceSchema = z.object({
  sectionId: z.string().min(1, "Section is required"),
  date: z.string().min(1, "Date is required"),
});

export async function saveAttendance(
  prevState: AttendanceFormState,
  formData: FormData
): Promise<AttendanceFormState> {
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

  const parsed = attendanceSchema.safeParse({
    sectionId: formData.get("sectionId"),
    date: formData.get("date"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Invalid attendance data",
    };
  }

  const { sectionId, date } = parsed.data;

  try {
    const activeSchoolYear = await prisma.schoolYear.findFirst({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    if (!activeSchoolYear) {
      return { error: "No active school year found" };
    }

    const enrollments = await prisma.enrollment.findMany({
      where: {
        sectionId,
        schoolYearId: activeSchoolYear.id,
        status: "ENROLLED",
      },
      include: {
        student: {
          select: {
            id: true,
            studentNo: true,
          },
        },
      },
      orderBy: {
        student: {
          studentNo: "asc",
        },
      },
    });

    if (enrollments.length === 0) {
      return {
        error:
          "No enrolled students found in this section for the active school year",
      };
    }

    // Store the attendance day explicitly as Asia/Manila midnight.
    const attendanceDate = new Date(`${date}T00:00:00+08:00`);

    await prisma.$transaction(
      enrollments.map((enrollment) => {
        const status = (formData.get(`status_${enrollment.studentId}`) as
          | "PRESENT"
          | "LATE"
          | "ABSENT"
          | "EXCUSED"
          | null) ?? "PRESENT";

        const remarksRaw = formData.get(`remarks_${enrollment.studentId}`);
        const remarks =
          typeof remarksRaw === "string" && remarksRaw.trim().length > 0
            ? remarksRaw.trim()
            : null;

        return prisma.attendance.upsert({
          where: {
            studentId_date: {
              studentId: enrollment.studentId,
              date: attendanceDate,
            },
          },
          update: {
            enrollmentId: enrollment.id,
            status,
            source: "MANUAL",
            remarks,
          },
          create: {
            studentId: enrollment.studentId,
            enrollmentId: enrollment.id,
            date: attendanceDate,
            status,
            source: "MANUAL",
            remarks,
          },
        });
      })
    );

    await logAudit({
      userId: session.user.id,
      action: "SAVE_ATTENDANCE",
      entity: "Attendance",
      entityId: null,
      description: `Saved attendance for section ${sectionId} on ${date} (${activeSchoolYear.name})`,
    });

    revalidatePath("/dashboard/teacher/attendance");
    revalidatePath("/dashboard/teacher/attendance/history");
    revalidatePath("/dashboard");

    return { success: "Attendance saved successfully" };
  } catch (error) {
    console.error("Save attendance failed:", error);
    return { error: "Failed to save attendance" };
  }
}