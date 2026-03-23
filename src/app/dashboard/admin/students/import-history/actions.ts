"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

export type ImportBatchFormState = {
  error?: string;
  success?: string;
};

const toggleArchiveSchema = z.object({
  batchId: z.string().min(1, "Batch is required"),
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

export async function toggleImportBatchArchive(formData: FormData) {
  const session = await requireAdmin();

  const parsed = toggleArchiveSchema.safeParse({
    batchId: formData.get("batchId"),
  });

  if (!parsed.success) {
    throw new Error("Invalid batch");
  }

  const batch = await prisma.studentImportBatch.findUnique({
    where: { id: parsed.data.batchId },
    select: {
      id: true,
      isArchived: true,
    },
  });

  if (!batch) {
    throw new Error("Import batch not found");
  }

  const updated = await prisma.studentImportBatch.update({
    where: { id: batch.id },
    data: {
      isArchived: !batch.isArchived,
    },
  });

  await logAudit({
    userId: session.user.id,
    action: updated.isArchived
      ? "ARCHIVE_STUDENT_IMPORT_BATCH"
      : "UNARCHIVE_STUDENT_IMPORT_BATCH",
    entity: "StudentImportBatch",
    entityId: updated.id,
    description: `${updated.isArchived ? "Archived" : "Unarchived"} student import batch ${updated.id}`,
  });

  revalidatePath("/dashboard/admin/students/import-history");
  revalidatePath(`/dashboard/admin/students/import-history/${updated.id}`);
}