"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { z } from "zod";

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

export async function createSection(formData: FormData) {
  await requireAdmin();

  const parsed = createSectionSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid section data");
  }

  await prisma.section.create({
    data: {
      name: parsed.data.name,
    },
  });
}

export async function createStudent(formData: FormData) {
  await requireAdmin();

  const parsed = createStudentSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    studentNo: formData.get("studentNo"),
    sectionId: formData.get("sectionId"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid student data");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (existingUser) {
    throw new Error("Email already exists");
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
}