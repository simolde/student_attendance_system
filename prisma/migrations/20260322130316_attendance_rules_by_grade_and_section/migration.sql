/*
  Warnings:

  - Added the required column `gradeLevel` to the `Section` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "GradeLevel" AS ENUM ('PRE_NURSERY', 'NURSERY', 'KINDER', 'GRADE_1', 'GRADE_2', 'GRADE_3', 'GRADE_5', 'GRADE_6', 'GRADE_7', 'GRADE_8', 'GRADE_9', 'GRADE_10', 'GRADE_11', 'GRADE_12');

-- AlterTable
ALTER TABLE "AttendanceRule" ADD COLUMN     "gradeLevel" "GradeLevel",
ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sectionId" TEXT;

-- AlterTable
ALTER TABLE "Section" ADD COLUMN     "gradeLevel" "GradeLevel" NOT NULL;

-- CreateIndex
CREATE INDEX "AttendanceRule_gradeLevel_isActive_idx" ON "AttendanceRule"("gradeLevel", "isActive");

-- CreateIndex
CREATE INDEX "AttendanceRule_sectionId_isActive_idx" ON "AttendanceRule"("sectionId", "isActive");

-- AddForeignKey
ALTER TABLE "AttendanceRule" ADD CONSTRAINT "AttendanceRule_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;
