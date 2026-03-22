import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { NextResponse } from "next/server";

function formatManilaDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (
    !hasRole(session.user.role, [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.TEACHER,
      ROLES.STAFF,
    ])
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const logs = await prisma.rfidLog.findMany({
    include: {
      student: {
        include: {
          user: true,
        },
      },
      device: true,
    },
    orderBy: {
      scanTime: "desc",
    },
    take: 20,
  });

  return NextResponse.json({
    logs: logs.map((log) => ({
      id: log.id,
      rfidUid: log.rfidUid,
      status: log.status,
      message: log.message,
      scanTime: log.scanTime.toISOString(),
      scanTimeDisplay: formatManilaDateTime(log.scanTime),
      student: log.student
        ? {
            studentNo: log.student.studentNo,
            name: log.student.user.name,
            email: log.student.user.email,
          }
        : null,
      device: log.device
        ? {
            name: log.device.name,
            deviceCode: log.device.deviceCode,
            location: log.device.location,
          }
        : null,
    })),
  });
}