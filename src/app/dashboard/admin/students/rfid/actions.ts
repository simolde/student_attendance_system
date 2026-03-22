"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

export type StudentRfidFormState = {
  error?: string;
  success?: string;
};

const assignRfidSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  rfidUid: z.string().trim().min(1, "RFID UID is required"),
});

const clearRfidSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
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

export async function assignStudentRfid(
  prevState: StudentRfidFormState,
  formData: FormData
): Promise<StudentRfidFormState> {
  const session = await requireAdmin();

  const parsed = assignRfidSchema.safeParse({
    studentId: formData.get("studentId"),
    rfidUid: formData.get("rfidUid"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Invalid RFID assignment",
    };
  }

  const studentId = parsed.data.studentId;
  const rfidUid = parsed.data.rfidUid.trim().toUpperCase();

  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!student) {
      return { error: "Student not found" };
    }

    const existingOwner = await prisma.student.findFirst({
      where: {
        rfidUid,
        NOT: { id: studentId },
      },
      select: {
        id: true,
        studentNo: true,
      },
    });

    if (existingOwner) {
      return {
        error: `RFID UID already assigned to student ${existingOwner.studentNo}`,
      };
    }

    await prisma.student.update({
      where: { id: studentId },
      data: { rfidUid },
    });

    await logAudit({
      userId: session.user.id,
      action: "ASSIGN_STUDENT_RFID",
      entity: "Student",
      entityId: studentId,
      description: `Assigned RFID ${rfidUid} to student ${student.studentNo}`,
    });

    revalidatePath("/dashboard/admin/students/rfid");

    return { success: "RFID assigned successfully" };
  } catch (error) {
    console.error(error);
    return { error: "Failed to assign RFID" };
  }
}

export async function clearStudentRfid(formData: FormData) {
  const session = await requireAdmin();

  const parsed = clearRfidSchema.safeParse({
    studentId: formData.get("studentId"),
  });

  if (!parsed.success) {
    throw new Error("Invalid student");
  }

  const student = await prisma.student.findUnique({
    where: { id: parsed.data.studentId },
    select: {
      id: true,
      studentNo: true,
      rfidUid: true,
    },
  });

  if (!student) {
    throw new Error("Student not found");
  }

  await prisma.student.update({
    where: { id: student.id },
    data: { rfidUid: null },
  });

  await logAudit({
    userId: session.user.id,
    action: "CLEAR_STUDENT_RFID",
    entity: "Student",
    entityId: student.id,
    description: `Cleared RFID ${student.rfidUid ?? "-"} from student ${student.studentNo}`,
  });

  revalidatePath("/dashboard/admin/students/rfid");
}