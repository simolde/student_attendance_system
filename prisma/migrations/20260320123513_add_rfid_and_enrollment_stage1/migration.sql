/*
  Warnings:

  - A unique constraint covering the columns `[rfidUid]` on the table `Student` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ENROLLED', 'DROPPED', 'GRADUATED', 'TRANSFERRED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "AttendanceSource" AS ENUM ('MANUAL', 'RFID', 'IMPORT');

-- CreateEnum
CREATE TYPE "RfidScanStatus" AS ENUM ('MATCHED', 'UNKNOWN_CARD', 'DUPLICATE_SCAN', 'DENIED');

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "enrollmentId" TEXT,
ADD COLUMN     "source" "AttendanceSource" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "timeIn" TIMESTAMP(3),
ADD COLUMN     "timeOut" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "rfidUid" TEXT;

-- CreateTable
CREATE TABLE "SchoolYear" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "schoolYearId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ENROLLED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RfidDevice" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "deviceCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RfidDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RfidLog" (
    "id" TEXT NOT NULL,
    "rfidUid" TEXT NOT NULL,
    "studentId" TEXT,
    "deviceId" TEXT,
    "scanTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "RfidScanStatus" NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RfidLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SchoolYear_name_key" ON "SchoolYear"("name");

-- CreateIndex
CREATE INDEX "Enrollment_schoolYearId_sectionId_idx" ON "Enrollment"("schoolYearId", "sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_studentId_schoolYearId_key" ON "Enrollment"("studentId", "schoolYearId");

-- CreateIndex
CREATE UNIQUE INDEX "RfidDevice_deviceCode_key" ON "RfidDevice"("deviceCode");

-- CreateIndex
CREATE INDEX "RfidLog_rfidUid_idx" ON "RfidLog"("rfidUid");

-- CreateIndex
CREATE INDEX "RfidLog_studentId_scanTime_idx" ON "RfidLog"("studentId", "scanTime");

-- CreateIndex
CREATE INDEX "Attendance_enrollmentId_date_idx" ON "Attendance"("enrollmentId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Student_rfidUid_key" ON "Student"("rfidUid");

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "SchoolYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfidLog" ADD CONSTRAINT "RfidLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfidLog" ADD CONSTRAINT "RfidLog_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "RfidDevice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
