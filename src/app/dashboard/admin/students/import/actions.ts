"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { logAudit } from "@/lib/audit";
import crypto from "node:crypto";

export type ImportRow = {
  student_no: string;
  full_name: string;
  email: string;
  section: string;
  grade_level: string;
  school_year?: string;
  status?: string;
  rfid_uid?: string;
};

export type ImportStudentsState = {
  error?: string;
  success?: string;
  summary?: {
    importBatchId: string;
    createdUsers: number;
    createdStudents: number;
    createdEnrollments: number;
    updatedUsers: number;
    updatedStudents: number;
    updatedEnrollments: number;
    skipped: number;
    errors: string[];
  };
};

const allowedGradeLevels = new Set([
  "PRE_NURSERY",
  "NURSERY",
  "KINDER",
  "GRADE_1",
  "GRADE_2",
  "GRADE_3",
  "GRADE_4",
  "GRADE_5",
  "GRADE_6",
  "GRADE_7",
  "GRADE_8",
  "GRADE_9",
  "GRADE_10",
  "GRADE_11",
  "GRADE_12",
]);

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

function normalizeStatus(value?: string) {
  const v = (value ?? "ENROLLED").trim().toUpperCase();
  if (
    v === "ENROLLED" ||
    v === "DROPPED" ||
    v === "GRADUATED" ||
    v === "TRANSFERRED" ||
    v === "INACTIVE"
  ) {
    return v;
  }
  return "ENROLLED";
}

function normalizeGradeLevel(value?: string) {
  const v = (value ?? "").trim().toUpperCase().replaceAll(" ", "_");
  return allowedGradeLevels.has(v) ? v : null;
}

export async function importStudentsFromRows(
  rows: ImportRow[]
): Promise<ImportStudentsState> {
  const session = await requireAdmin();

  if (!rows.length) {
    return { error: "No rows to import" };
  }

  const activeSchoolYear = await prisma.schoolYear.findFirst({
    where: { isActive: true },
    select: { id: true, name: true },
  });

  if (!activeSchoolYear) {
    return { error: "No active school year found" };
  }

  const importBatchId = crypto.randomUUID();

  let createdUsers = 0;
  let createdStudents = 0;
  let createdEnrollments = 0;
  let updatedUsers = 0;
  let updatedStudents = 0;
  let updatedEnrollments = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    const rowNo = index + 1;

    const studentNo = row.student_no?.trim();
    const fullName = row.full_name?.trim();
    const email = row.email?.trim().toLowerCase();
    const sectionName = row.section?.trim();
    const gradeLevel = normalizeGradeLevel(row.grade_level);
    const status = normalizeStatus(row.status);
    const rfidUid = row.rfid_uid?.trim().toUpperCase() || null;

    if (!studentNo || !fullName || !email || !sectionName || !gradeLevel) {
      skipped++;
      errors.push(`Row ${rowNo}: Missing required fields or invalid grade_level.`);
      continue;
    }

    try {
      const section = await prisma.section.upsert({
        where: { name: sectionName },
        update: {
          gradeLevel: gradeLevel as never,
        },
        create: {
          name: sectionName,
          gradeLevel: gradeLevel as never,
        },
        select: { id: true },
      });

      const existingStudent = await prisma.student.findUnique({
        where: { studentNo },
        include: { user: true },
      });

      if (existingStudent) {
        const emailOwner = await prisma.user.findFirst({
          where: {
            email,
            NOT: { id: existingStudent.userId },
          },
          select: { id: true },
        });

        if (emailOwner) {
          skipped++;
          errors.push(`Row ${rowNo}: Email ${email} already belongs to another user.`);
          continue;
        }

        if (rfidUid) {
          const rfidOwner = await prisma.student.findFirst({
            where: {
              rfidUid,
              NOT: { id: existingStudent.id },
            },
            select: { id: true, studentNo: true },
          });

          if (rfidOwner) {
            skipped++;
            errors.push(`Row ${rowNo}: RFID ${rfidUid} already belongs to ${rfidOwner.studentNo}.`);
            continue;
          }
        }

        await prisma.user.update({
          where: { id: existingStudent.userId },
          data: {
            name: fullName,
            email,
            role: "STUDENT",
            isActive: true,
          },
        });
        updatedUsers++;

        await prisma.student.update({
          where: { id: existingStudent.id },
          data: {
            sectionId: section.id,
            rfidUid: rfidUid || existingStudent.rfidUid || null,
            importBatchId,
          },
        });
        updatedStudents++;

        const existingEnrollment = await prisma.enrollment.findUnique({
          where: {
            studentId_schoolYearId: {
              studentId: existingStudent.id,
              schoolYearId: activeSchoolYear.id,
            },
          },
          select: { id: true },
        });

        if (existingEnrollment) {
          await prisma.enrollment.update({
            where: { id: existingEnrollment.id },
            data: {
              sectionId: section.id,
              status,
            },
          });
          updatedEnrollments++;
        } else {
          await prisma.enrollment.create({
            data: {
              studentId: existingStudent.id,
              schoolYearId: activeSchoolYear.id,
              sectionId: section.id,
              status,
            },
          });
          createdEnrollments++;
        }

        continue;
      }

      const emailExists = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (emailExists) {
        skipped++;
        errors.push(`Row ${rowNo}: Email ${email} already exists.`);
        continue;
      }

      if (rfidUid) {
        const rfidOwner = await prisma.student.findFirst({
          where: { rfidUid },
          select: { studentNo: true },
        });

        if (rfidOwner) {
          skipped++;
          errors.push(`Row ${rowNo}: RFID ${rfidUid} already belongs to ${rfidOwner.studentNo}.`);
          continue;
        }
      }

      const defaultPassword = await bcrypt.hash("Student@123", 12);

      const createdUser = await prisma.user.create({
        data: {
          name: fullName,
          email,
          password: defaultPassword,
          role: "STUDENT",
          isActive: true,
          mustChangePassword: true,
        },
        select: { id: true },
      });
      createdUsers++;

      const createdStudent = await prisma.student.create({
        data: {
          userId: createdUser.id,
          studentNo,
          sectionId: section.id,
          rfidUid,
          importBatchId,
        },
        select: { id: true },
      });
      createdStudents++;

      await prisma.enrollment.create({
        data: {
          studentId: createdStudent.id,
          schoolYearId: activeSchoolYear.id,
          sectionId: section.id,
          status,
        },
      });
      createdEnrollments++;
    } catch (error) {
      skipped++;
      errors.push(`Row ${rowNo}: Failed to import.`);
      console.error(`Import row ${rowNo} failed`, error);
    }
  }

  await logAudit({
    userId: session.user.id,
    action: "IMPORT_STUDENTS",
    entity: "Student",
    entityId: null,
    description: `Imported students for active school year ${activeSchoolYear.name} with batch ${importBatchId}`,
  });

  return {
    success: "Student import completed",
    summary: {
      importBatchId,
      createdUsers,
      createdStudents,
      createdEnrollments,
      updatedUsers,
      updatedStudents,
      updatedEnrollments,
      skipped,
      errors,
    },
  };
}