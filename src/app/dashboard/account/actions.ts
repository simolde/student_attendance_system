"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

export type AccountFormState = {
  error?: string;
  success?: string;
};

const updateAccountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
});

export async function updateMyAccount(
  prevState: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const parsed = updateAccountSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Invalid account update",
    };
  }

  const { name, email } = parsed.data;

  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!currentUser) {
      return { error: "User not found" };
    }

    const emailOwner = await prisma.user.findFirst({
      where: {
        email,
        NOT: {
          id: session.user.id,
        },
      },
      select: { id: true },
    });

    if (emailOwner) {
      return { error: "Email is already in use" };
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        email,
      },
    });

    await logAudit({
      userId: session.user.id,
      action: "UPDATE_OWN_ACCOUNT",
      entity: "User",
      entityId: updatedUser.id,
      description: `Updated own account from ${currentUser.email} to ${updatedUser.email}`,
    });

    revalidatePath("/dashboard/account");
    revalidatePath("/dashboard");

    return { success: "Account updated successfully" };
  } catch {
    return { error: "Failed to update account" };
  }
}