"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

export type RfidDeviceFormState = {
  error?: string;
  success?: string;
};

const createDeviceSchema = z.object({
  name: z.string().min(1, "Device name is required"),
  deviceCode: z.string().min(1, "Device code is required"),
  location: z.string().optional(),
});

const toggleDeviceSchema = z.object({
  deviceId: z.string().min(1, "Device is required"),
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

export async function createRfidDevice(
  prevState: RfidDeviceFormState,
  formData: FormData
): Promise<RfidDeviceFormState> {
  const session = await requireAdmin();

  const parsed = createDeviceSchema.safeParse({
    name: formData.get("name"),
    deviceCode: formData.get("deviceCode"),
    location: formData.get("location"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Invalid device data",
    };
  }

  const { name, deviceCode, location } = parsed.data;

  try {
    const existing = await prisma.rfidDevice.findUnique({
      where: { deviceCode: deviceCode.trim() },
      select: { id: true },
    });

    if (existing) {
      return { error: "Device code already exists" };
    }

    const created = await prisma.rfidDevice.create({
      data: {
        name: name.trim(),
        deviceCode: deviceCode.trim(),
        location: location?.trim() || null,
        isActive: true,
      },
    });

    await logAudit({
      userId: session.user.id,
      action: "CREATE_RFID_DEVICE",
      entity: "RfidDevice",
      entityId: created.id,
      description: `Created RFID device ${created.name} (${created.deviceCode})`,
    });

    revalidatePath("/dashboard/admin/rfid-devices");

    return { success: "RFID device created successfully" };
  } catch (error) {
    console.error(error);
    return { error: "Failed to create RFID device" };
  }
}

export async function toggleRfidDevice(formData: FormData) {
  const session = await requireAdmin();

  const parsed = toggleDeviceSchema.safeParse({
    deviceId: formData.get("deviceId"),
  });

  if (!parsed.success) {
    throw new Error("Invalid device");
  }

  const device = await prisma.rfidDevice.findUnique({
    where: { id: parsed.data.deviceId },
    select: {
      id: true,
      name: true,
      deviceCode: true,
      isActive: true,
    },
  });

  if (!device) {
    throw new Error("RFID device not found");
  }

  const updated = await prisma.rfidDevice.update({
    where: { id: device.id },
    data: { isActive: !device.isActive },
  });

  await logAudit({
    userId: session.user.id,
    action: updated.isActive ? "ACTIVATE_RFID_DEVICE" : "DEACTIVATE_RFID_DEVICE",
    entity: "RfidDevice",
    entityId: updated.id,
    description: `${updated.isActive ? "Activated" : "Deactivated"} RFID device ${updated.name} (${updated.deviceCode})`,
  });

  revalidatePath("/dashboard/admin/rfid-devices");
}