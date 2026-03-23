"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

export type UserFormState = {
  error?: string;
  success?: string;
};

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .regex(/[A-Z]/, "New password must include at least one uppercase letter")
      .regex(/[a-z]/, "New password must include at least one lowercase letter")
      .regex(/[0-9]/, "New password must include at least one number")
      .regex(/[^A-Za-z0-9]/, "New password must include at least one special character"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirm password do not match",
    path: ["confirmPassword"],
  });

export async function changeMyPassword(
  prevState: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Invalid password data",
    };
  }

  const { currentPassword, newPassword } = parsed.data;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        password: true,
        mustChangePassword: true,
      },
    });

    if (!user || !user.password) {
      return { error: "User not found" };
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      return { error: "Current password is incorrect" };
    }

    const isSameAsOld = await bcrypt.compare(newPassword, user.password);
    if (isSameAsOld) {
      return { error: "New password must be different from the current password" };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
      },
    });

    await logAudit({
      userId: user.id,
      action: "CHANGE_PASSWORD",
      entity: "User",
      entityId: user.id,
      description: `Changed own password`,
    });

    revalidatePath("/dashboard/change-password");
    revalidatePath("/dashboard/account");
    revalidatePath("/dashboard");

    return { success: "Password changed successfully" };
  } catch (error) {
    console.error(error);
    return { error: "Failed to change password" };
  }
}