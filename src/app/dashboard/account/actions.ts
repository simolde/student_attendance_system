"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { del } from "@vercel/blob";

export type AccountFormState = {
  error?: string;
  success?: string;
};

const updateAccountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  image: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || ""),
});

function isVercelBlobUrl(url: string | null | undefined) {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    return parsed.hostname.includes("blob.vercel-storage.com");
  } catch {
    return false;
  }
}

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
    image: formData.get("image"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Invalid account update",
    };
  }

  const { name, email, image } = parsed.data;

  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        image: true,
      },
    });

    if (!currentUser) {
      return { error: "User not found" };
    }

    const emailOwner = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id: session.user.id },
      },
      select: { id: true },
    });

    if (emailOwner) {
      return { error: "Email is already in use" };
    }

    const normalizedImage = image.length > 0 ? image : null;
    const oldImage = currentUser.image;

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        email,
        image: normalizedImage,
      },
    });

    const imageChanged = oldImage && oldImage !== normalizedImage;

    if (imageChanged && isVercelBlobUrl(oldImage)) {
      try {
        await del(oldImage);
      } catch (deleteError) {
        console.error("Failed to delete old avatar:", deleteError);
      }
    }

    await logAudit({
      userId: session.user.id,
      action: "UPDATE_OWN_ACCOUNT",
      entity: "User",
      entityId: updatedUser.id,
      description: "Updated own account details",
    });

    revalidatePath("/dashboard/account");
    revalidatePath("/dashboard");

    return {
      success:
        "Account updated successfully. Sign out and sign in again if the sidebar image does not update immediately.",
    };
  } catch {
    return { error: "Failed to update account" };
  }
}