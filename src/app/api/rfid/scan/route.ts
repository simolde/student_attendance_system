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

  return formatter.format(date);
}

function getManilaDateStart(date: Date) {
  const day = manilaDateOnly(date);
  return new Date(`${day}T00:00:00+08:00`);
}

function getManilaTimeHHMM(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

async function resolveAttendanceRule(sectionId: string, gradeLevel: string | null) {
  const sectionRule = await prisma.attendanceRule.findFirst({
    where: {
      isActive: true,
      sectionId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (sectionRule) {
    return sectionRule;
  }

  if (gradeLevel) {
    const gradeRule = await prisma.attendanceRule.findFirst({
      where: {
        isActive: true,
        sectionId: null,
        gradeLevel: gradeLevel as never,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (gradeRule) {
      return gradeRule;
    }
  }

  const defaultRule = await prisma.attendanceRule.findFirst({
    where: {
      isActive: true,
      isDefault: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return defaultRule;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ScanBody;

    const rfidUid = body.rfidUid?.trim().toUpperCase();
    const deviceCode = body.deviceCode?.trim() || null;

    if (!rfidUid) {
      return NextResponse.json(
        { success: false, message: "rfidUid is required" },
        { status: 400 }
      );
    }

    const scanMoment = body.scanTime ? new Date(body.scanTime) : new Date();

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

    const rule = await resolveAttendanceRule(
      enrollment.sectionId,
      enrollment.section.gradeLevel ?? null
    );

    if (!rule) {
      await prisma.rfidLog.create({
        data: {
          rfidUid,
          studentId: student.id,
          deviceId,
          scanTime: scanMoment,
          status: "DENIED",
          message: "No active attendance rule matched this student's section or grade level",
        },
      });

      return NextResponse.json(
        {
          success: false,
          message: "No active attendance rule found for this student",
        },
        { status: 400 }
      );
    }

    const manilaTime = getManilaTimeHHMM(scanMoment);
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
      if (manilaTime < rule.timeInStart) {
        await prisma.rfidLog.create({
          data: {
            rfidUid,
            studentId: student.id,
            deviceId,
            scanTime: scanMoment,
            status: "DENIED",
            message: `Scan too early. Allowed time in starts at ${rule.timeInStart}`,
          },
        });

        return NextResponse.json(
          {
            success: false,
            message: `Scan too early. Allowed time in starts at ${rule.timeInStart}`,
          },
          { status: 403 }
        );
      }

      if (manilaTime > rule.timeInEnd) {
        await prisma.rfidLog.create({
          data: {
            rfidUid,
            studentId: student.id,
            deviceId,
            scanTime: scanMoment,
            status: "DENIED",
            message: `Time in window already closed at ${rule.timeInEnd}`,
          },
        });

        return NextResponse.json(
          {
            success: false,
            message: `Time in window already closed at ${rule.timeInEnd}`,
          },
          { status: 403 }
        );
      }

      const attendanceStatus = manilaTime >= rule.lateAfter ? "LATE" : "PRESENT";

      const created = await prisma.attendance.create({
        data: {
          studentId: student.id,
          enrollmentId: enrollment.id,
          date: attendanceDate,
          status: attendanceStatus,
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
          message: `${attendanceStatus === "LATE" ? "Late" : "Present"} time in recorded using rule ${rule.name}`,
        },
      });

      return NextResponse.json({
        success: true,
        message:
          attendanceStatus === "LATE"
            ? "Late time in recorded"
            : "Time in recorded",
        type: "TIME_IN",
        attendanceId: created.id,
        attendanceStatus,
        appliedRule: rule.name,
        student: {
          studentNo: student.studentNo,
          name: student.user.name,
          email: student.user.email,
          section: enrollment.section.name,
          gradeLevel: enrollment.section.gradeLevel,
        },
      });
    }

    if (!existingAttendance.timeOut) {
      if (!rule.timeOutStart || !rule.timeOutEnd) {
        await prisma.rfidLog.create({
          data: {
            rfidUid,
            studentId: student.id,
            deviceId,
            scanTime: scanMoment,
            status: "DENIED",
            message: "No time out window configured for the matched attendance rule",
          },
        });

        return NextResponse.json(
          {
            success: false,
            message: "No time out window configured for this rule",
          },
          { status: 403 }
        );
      }

      if (manilaTime < rule.timeOutStart) {
        await prisma.rfidLog.create({
          data: {
            rfidUid,
            studentId: student.id,
            deviceId,
            scanTime: scanMoment,
            status: "DENIED",
            message: `Time out window has not started yet. Starts at ${rule.timeOutStart}`,
          },
        });

        return NextResponse.json(
          {
            success: false,
            message: `Time out window has not started yet. Starts at ${rule.timeOutStart}`,
          },
          { status: 403 }
        );
      }

      if (manilaTime > rule.timeOutEnd) {
        await prisma.rfidLog.create({
          data: {
            rfidUid,
            studentId: student.id,
            deviceId,
            scanTime: scanMoment,
            status: "DENIED",
            message: `Time out window already closed at ${rule.timeOutEnd}`,
          },
        });

        return NextResponse.json(
          {
            success: false,
            message: `Time out window already closed at ${rule.timeOutEnd}`,
          },
          { status: 403 }
        );
      }

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
          message: `Time out recorded using rule ${rule.name}`,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Time out recorded",
        type: "TIME_OUT",
        attendanceId: updated.id,
        appliedRule: rule.name,
        student: {
          studentNo: student.studentNo,
          name: student.user.name,
          email: student.user.email,
          section: enrollment.section.name,
          gradeLevel: enrollment.section.gradeLevel,
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