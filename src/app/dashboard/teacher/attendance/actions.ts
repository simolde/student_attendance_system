"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type AttendanceFormState = {
  error?: string;
  success?: string;
};

const attendanceSchema = z.object({
  sectionId: z.string().min(1, "Section is required"),
  date: z.string().min(1, "Date is required"),
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

export async function saveAttendance(
  prevState: AttendanceFormState,
  formData: FormData
): Promise<AttendanceFormState> {
  await requireAttendanceAccess();

  const parsed = attendanceSchema.safeParse({
    sectionId: formData.get("sectionId"),
    date: formData.get("date"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid form data" };
  }

  const { sectionId, date } = parsed.data;

  const students = await prisma.student.findMany({
    where: { sectionId },
    orderBy: { createdAt: "asc" },
  });

  if (students.length === 0) {
    return { error: "No students found in this section" };
  }

  try {
    for (const student of students) {
      const status = formData.get(`status_${student.id}`)?.toString();

      if (!status) continue;

      await prisma.attendance.upsert({
        where: {
          studentId_date: {
            studentId: student.id,
            date: new Date(date),
          },
        },
        update: {
          status: status as "PRESENT" | "LATE" | "ABSENT" | "EXCUSED",
          remarks: formData.get(`remarks_${student.id}`)?.toString() || null,
        },
        create: {
          studentId: student.id,
          date: new Date(date),
          status: status as "PRESENT" | "LATE" | "ABSENT" | "EXCUSED",
          remarks: formData.get(`remarks_${student.id}`)?.toString() || null,
        },
      });
    }

    revalidatePath("/dashboard/teacher/attendance");

    return { success: "Attendance saved successfully" };
  } catch {
    return { error: "Failed to save attendance" };
  }
}