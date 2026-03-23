"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

export type FormState = {
  error?: string;
  success?: string;
};

const gradeLevels = [
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

const createSectionSchema = z.object({
  name: z.string().min(1, "Section name is required"),
  gradeLevel: z.enum(gradeLevels, {
    message: "Grade level is required",
  }),
});

const createStudentSchema = z.object({
  name: z.string().min(1, "Student name is required"),
  email: z.string().email("Valid email is required"),
  studentNo: z.string().min(1, "Student number is required"),
  sectionId: z.string().min(1, "Section is required"),
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

export async function createSection(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await requireAdmin();

  const parsed = createSectionSchema.safeParse({
    name: formData.get("name"),
    gradeLevel: formData.get("gradeLevel"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Invalid section data",
    };
  }

  try {
    const existingSection = await prisma.section.findUnique({
      where: { name: parsed.data.name.trim() },
      select: { id: true },
    });

    if (existingSection) {
      return { error: "Section already exists" };
    }

    const section = await prisma.section.create({
      data: {
        name: parsed.data.name.trim(),
        gradeLevel: parsed.data.gradeLevel,
      },
    });

    await logAudit({
      userId: session.user.id,
      action: "CREATE_SECTION",
      entity: "Section",
      entityId: section.id,
      description: `Created section ${section.name} (${section.gradeLevel})`,
    });

    revalidatePath("/dashboard/admin/students");
    revalidatePath("/dashboard/admin/attendance-rules");

    return { success: "Section created successfully" };
  } catch (error) {
    console.error(error);
    return { error: "Section could not be created" };
  }
}

export async function createStudent(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await requireAdmin();

  const parsed = createStudentSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    studentNo: formData.get("studentNo"),
    sectionId: formData.get("sectionId"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Invalid student data",
    };
  }

  try {
    const activeSchoolYear = await prisma.schoolYear.findFirst({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    if (!activeSchoolYear) {
      return { error: "No active school year found" };
    }

    const section = await prisma.section.findUnique({
      where: { id: parsed.data.sectionId },
      select: { id: true, name: true, gradeLevel: true },
    });

    if (!section) {
      return { error: "Selected section not found" };
    }

    const email = parsed.data.email.trim().toLowerCase();
    const studentNo = parsed.data.studentNo.trim();

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return { error: "Email already exists" };
    }

    const existingStudentNo = await prisma.student.findUnique({
      where: { studentNo },
      select: { id: true },
    });

    if (existingStudentNo) {
      return { error: "Student number already exists" };
    }

    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: parsed.data.name.trim(),
          email,
          role: "STUDENT",
          isActive: true,
          mustChangePassword: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      const student = await tx.student.create({
        data: {
          userId: user.id,
          studentNo,
          sectionId: section.id, // kept for staged compatibility
        },
        select: {
          id: true,
          studentNo: true,
        },
      });

      await tx.enrollment.create({
        data: {
          studentId: student.id,
          schoolYearId: activeSchoolYear.id,
          sectionId: section.id,
          status: "ENROLLED",
        },
      });

      return { user, student };
    });

    await logAudit({
      userId: session.user.id,
      action: "CREATE_STUDENT",
      entity: "Student",
      entityId: created.student.id,
      description: `Created student ${created.user.name} (${created.user.email}) for ${activeSchoolYear.name}`,
    });

    revalidatePath("/dashboard/admin/students");
    revalidatePath("/dashboard/admin/students/rfid");
    revalidatePath("/dashboard");

    return { success: "Student created successfully" };
  } catch (error) {
    console.error(error);
    return { error: "Student could not be created" };
  }
}