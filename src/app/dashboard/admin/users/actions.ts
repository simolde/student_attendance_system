"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { logAudit } from "@/lib/audit";

export type UserFormState = {
  error?: string;
  success?: string;
};

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "TEACHER", "STAFF", "STUDENT"]),
});

const updateRoleSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "TEACHER", "STAFF", "STUDENT"]),
});

const resetPasswordSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const toggleActiveSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
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

export async function createUser(
  prevState: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const session = await requireAdmin();

  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Invalid user data",
    };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (existingUser) {
      return { error: "Email already exists" };
    }

    const hashedPassword = await bcrypt.hash(parsed.data.password, 12);

    const createdUser = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: hashedPassword,
        role: parsed.data.role,
        isActive: true,
      },
    });

    await logAudit({
      userId: session.user.id,
      action: "CREATE_USER",
      entity: "User",
      entityId: createdUser.id,
      description: `Created user ${createdUser.email} with role ${createdUser.role}`,
    });

    revalidatePath("/dashboard/admin/users");

    return { success: "User created successfully" };
  } catch {
    return { error: "Failed to create user" };
  }
}

export async function updateUserRole(formData: FormData) {
  const session = await requireAdmin();

  const parsed = updateRoleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid role update");
  }

  const { userId, role } = parsed.data;

  if (
    session.user.id === userId &&
    role !== ROLES.SUPER_ADMIN &&
    role !== ROLES.ADMIN
  ) {
    throw new Error("You cannot remove your own admin access");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  await logAudit({
    userId: session.user.id,
    action: "UPDATE_ROLE",
    entity: "User",
    entityId: updatedUser.id,
    description: `Changed role of ${updatedUser.email} to ${updatedUser.role}`,
  });

  revalidatePath("/dashboard/admin/users");
}

export async function resetUserPassword(formData: FormData) {
  const session = await requireAdmin();

  const parsed = resetPasswordSchema.safeParse({
    userId: formData.get("userId"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message || "Invalid password reset"
    );
  }

  const { userId, password } = parsed.data;

  const hashedPassword = await bcrypt.hash(password, 12);

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  await logAudit({
    userId: session.user.id,
    action: "RESET_PASSWORD",
    entity: "User",
    entityId: updatedUser.id,
    description: `Reset password for ${updatedUser.email}`,
  });

  revalidatePath("/dashboard/admin/users");
}

export async function toggleUserActive(formData: FormData) {
  const session = await requireAdmin();

  const parsed = toggleActiveSchema.safeParse({
    userId: formData.get("userId"),
  });

  if (!parsed.success) {
    throw new Error("Invalid user");
  }

  const { userId } = parsed.data;

  if (session.user.id === userId) {
    throw new Error("You cannot deactivate your own account");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isActive: true, email: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
  });

  await logAudit({
    userId: session.user.id,
    action: updatedUser.isActive ? "ACTIVATE_USER" : "DEACTIVATE_USER",
    entity: "User",
    entityId: updatedUser.id,
    description: `${updatedUser.isActive ? "Activated" : "Deactivated"} user ${updatedUser.email}`,
  });

  revalidatePath("/dashboard/admin/users");
}