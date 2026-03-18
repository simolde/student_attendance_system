"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { logAudit } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

export type ChangePasswordState = {
  error?: string;
  success?: string;
};

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirm password do not match",
    path: ["confirmPassword"],
  });

export async function changeMyPassword(
  prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const rl = rateLimit(`change-password:${session.user.id}`, {
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });

  if (!rl.success) {
    return { error: "Too many password change attempts. Please try again later." };
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Invalid password change request",
    };
  }

  const { currentPassword, newPassword } = parsed.data;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !user.password) {
      return { error: "User account not found" };
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);

    if (!isValid) {
      return { error: "Current password is incorrect" };
    }

    const sameAsOld = await bcrypt.compare(newPassword, user.password);

    if (sameAsOld) {
      return { error: "New password must be different from your current password" };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    await logAudit({
      userId: session.user.id,
      action: "CHANGE_OWN_PASSWORD",
      entity: "User",
      entityId: session.user.id,
      description: `User changed their own password`,
    });

    revalidatePath("/dashboard/change-password");

    return { success: "Password changed successfully" };
  } catch {
    return { error: "Failed to change password" };
  }
}