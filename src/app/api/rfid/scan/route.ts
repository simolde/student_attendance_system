import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type ScanBody = {
  rfidUid?: string;
  deviceCode?: string;
  scanTime?: string;
};

function manilaDateOnly(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(date); // YYYY-MM-DD
}

function getManilaDateStart(date: Date) {
  const day = manilaDateOnly(date);
  return new Date(`${day}T00:00:00+08:00`);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ScanBody;

    const rfidUid = body.rfidUid?.trim();
    const deviceCode = body.deviceCode?.trim() || null;

    if (!rfidUid) {
      return NextResponse.json(
        { success: false, message: "rfidUid is required" },
        { status: 400 }
      );
    }

    const scanMoment = body.scanTime
      ? new Date(body.scanTime)
      : new Date();

    if (Number.isNaN(scanMoment.getTime())) {
      return NextResponse.json(
        { success: false, message: "Invalid scanTime" },
        { status: 400 }
      );
    }

    const activeSchoolYear = await prisma.schoolYear.findFirst({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    if (!activeSchoolYear) {
      await prisma.rfidLog.create({
        data: {
          rfidUid,
          scanTime: scanMoment,
          status: "DENIED",
          message: "No active school year",
        },
      });

      return NextResponse.json(
        { success: false, message: "No active school year" },
        { status: 400 }
      );
    }

    const student = await prisma.student.findFirst({
      where: { rfidUid },
      include: {
        user: true,
      },
    });

    if (!student) {
      await prisma.rfidLog.create({
        data: {
          rfidUid,
          scanTime: scanMoment,
          status: "UNKNOWN_CARD",
          message: "RFID not linked to any student",
        },
      });

      return NextResponse.json(
        { success: false, message: "Unknown RFID card" },
        { status: 404 }
      );
    }

    if (!student.user.isActive) {
      await prisma.rfidLog.create({
        data: {
          rfidUid,
          studentId: student.id,
          scanTime: scanMoment,
          status: "DENIED",
          message: "Student user account is inactive",
        },
      });

      return NextResponse.json(
        { success: false, message: "Student account is inactive" },
        { status: 403 }
      );
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_schoolYearId: {
          studentId: student.id,
          schoolYearId: activeSchoolYear.id,
        },
      },
      include: {
        section: true,
      },
    });

    if (!enrollment || enrollment.status !== "ENROLLED") {
      await prisma.rfidLog.create({
        data: {
          rfidUid,
          studentId: student.id,
          scanTime: scanMoment,
          status: "DENIED",
          message: "No active enrolled record for current school year",
        },
      });

      return NextResponse.json(
        { success: false, message: "Student is not actively enrolled" },
        { status: 403 }
      );
    }

    let deviceId: string | null = null;

    if (deviceCode) {
      const device = await prisma.rfidDevice.findFirst({
        where: { deviceCode, isActive: true },
        select: { id: true },
      });

      deviceId = device?.id ?? null;
    }

    const attendanceDate = getManilaDateStart(scanMoment);

    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        studentId_date: {
          studentId: student.id,
          date: attendanceDate,
        },
      },
    });

    if (!existingAttendance) {
      const created = await prisma.attendance.create({
        data: {
          studentId: student.id,
          enrollmentId: enrollment.id,
          date: attendanceDate,
          status: "PRESENT",
          source: "RFID",
          timeIn: scanMoment,
        },
      });

      await prisma.rfidLog.create({
        data: {
          rfidUid,
          studentId: student.id,
          deviceId,
          scanTime: scanMoment,
          status: "MATCHED",
          message: "Time in recorded",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Time in recorded",
        type: "TIME_IN",
        attendanceId: created.id,
        student: {
          studentNo: student.studentNo,
          name: student.user.name,
          email: student.user.email,
          section: enrollment.section.name,
        },
      });
    }

    if (!existingAttendance.timeOut) {
      const updated = await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          enrollmentId: enrollment.id,
          source: "RFID",
          timeOut: scanMoment,
        },
      });

      await prisma.rfidLog.create({
        data: {
          rfidUid,
          studentId: student.id,
          deviceId,
          scanTime: scanMoment,
          status: "MATCHED",
          message: "Time out recorded",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Time out recorded",
        type: "TIME_OUT",
        attendanceId: updated.id,
        student: {
          studentNo: student.studentNo,
          name: student.user.name,
          email: student.user.email,
          section: enrollment.section.name,
        },
      });
    }

    await prisma.rfidLog.create({
      data: {
        rfidUid,
        studentId: student.id,
        deviceId,
        scanTime: scanMoment,
        status: "DUPLICATE_SCAN",
        message: "Attendance already has time in and time out",
      },
    });

    return NextResponse.json(
      {
        success: false,
        message: "Duplicate scan: attendance already completed for today",
      },
      { status: 409 }
    );
  } catch (error) {
    console.error("RFID scan API error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}