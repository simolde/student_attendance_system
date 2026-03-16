"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type FormState = {
  error?: string;
  success?: string;
};

const createSectionSchema = z.object({
  name: z.string().min(1, "Section name is required"),
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
  await requireAdmin();

  const parsed = createSectionSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Invalid section data",
    };
  }

  try {
    await prisma.section.create({
      data: {
        name: parsed.data.name,
      },
    });

    revalidatePath("/dashboard/admin/students");

    return { success: "Section created successfully" };
  } catch {
    return { error: "Section already exists or could not be created" };
  }
}

export async function createStudent(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

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
    const existingUser = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (existingUser) {
      return { error: "Email already exists" };
    }

    const existingStudentNo = await prisma.student.findUnique({
      where: { studentNo: parsed.data.studentNo },
    });

    if (existingStudentNo) {
      return { error: "Student number already exists" };
    }

    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        role: "STUDENT",
        isActive: true,
        student: {
          create: {
            studentNo: parsed.data.studentNo,
            sectionId: parsed.data.sectionId,
          },
        },
      },
    });

    revalidatePath("/dashboard/admin/students");

    return { success: "Student created successfully" };
  } catch {
    return { error: "Student could not be created" };
  }
}