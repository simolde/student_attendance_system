"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { logAudit } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { passwordSchema } from "@/lib/password-policy";

export type UserFormState = {
  error?: string;
  success?: string;
};

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: passwordSchema,
  role: z.enum(["SUPER_ADMIN", "ADMIN", "TEACHER", "STAFF", "STUDENT"]),
});

const updateRoleSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "TEACHER", "STAFF", "STUDENT"]),
});

const resetPasswordSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  password: passwordSchema,
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
      where: { email: parsed.data.email.trim().toLowerCase() },
    });

    if (existingUser) {
      return { error: "Email already exists" };
    }

    const hashedPassword = await bcrypt.hash(parsed.data.password, 12);

    const createdUser = await prisma.user.create({
      data: {
        name: parsed.data.name.trim(),
        email: parsed.data.email.trim().toLowerCase(),
        password: hashedPassword,
        role: parsed.data.role,
        isActive: true,
        mustChangePassword: false,
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
  } catch (error) {
    console.error(error);
    return { error: "Failed to create user" };
  }
}

export async function updateUserRole(
  prevState: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const session = await requireAdmin();

  const parsed = updateRoleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid role update" };
  }

  const { userId, role } = parsed.data;

  if (
    session.user.id === userId &&
    role !== ROLES.SUPER_ADMIN &&
    role !== ROLES.ADMIN
  ) {
    return { error: "You cannot remove your own admin access" };
  }

  try {
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

    return { success: "Role updated successfully" };
  } catch (error) {
    console.error(error);
    return { error: "Failed to update role" };
  }
}

export async function resetUserPassword(
  prevState: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const session = await requireAdmin();

  const rl = rateLimit(`admin-reset-password:${session.user.id}`, {
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });

  if (!rl.success) {
    return { error: "Too many password reset attempts. Please try again later." };
  }

  const parsed = resetPasswordSchema.safeParse({
    userId: formData.get("userId"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Invalid password reset",
    };
  }

  const { userId, password } = parsed.data;

  try {
    const hashedPassword = await bcrypt.hash(password, 12);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        mustChangePassword: true,
      },
    });

    await logAudit({
      userId: session.user.id,
      action: "RESET_PASSWORD",
      entity: "User",
      entityId: updatedUser.id,
      description: `Reset password for ${updatedUser.email} and required password change on next login`,
    });

    revalidatePath("/dashboard/admin/users");

    return { success: "Password reset successfully. User must change it on next login." };
  } catch (error) {
    console.error(error);
    return { error: "Failed to reset password" };
  }
}

export async function toggleUserActive(
  prevState: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const session = await requireAdmin();

  const parsed = toggleActiveSchema.safeParse({
    userId: formData.get("userId"),
  });

  if (!parsed.success) {
    return { error: "Invalid user" };
  }

  const { userId } = parsed.data;

  if (session.user.id === userId) {
    return { error: "You cannot deactivate your own account" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isActive: true, email: true },
    });

    if (!user) {
      return { error: "User not found" };
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

    return {
      success: updatedUser.isActive
        ? "User activated successfully"
        : "User deactivated successfully",
    };
  } catch (error) {
    console.error(error);
    return { error: "Failed to update user status" };
  }
}