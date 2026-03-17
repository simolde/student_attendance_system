import { prisma } from "@/lib/prisma";

type AuditInput = {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  description?: string | null;
};

export async function logAudit({
  userId,
  action,
  entity,
  entityId,
  description,
}: AuditInput) {
  await prisma.auditLog.create({
    data: {
      userId: userId ?? null,
      action,
      entity,
      entityId: entityId ?? null,
      description: description ?? null,
    },
  });
}