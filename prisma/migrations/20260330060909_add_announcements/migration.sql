/*
  Warnings:

  - You are about to drop the column `role` on the `Announcement` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Announcement` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AnnouncementTarget" AS ENUM ('ALL', 'TEACHER', 'STUDENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "AnnouncementStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Announcement" DROP COLUMN "role",
ADD COLUMN     "authorId" TEXT,
ADD COLUMN     "isPinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" "AnnouncementStatus" NOT NULL DEFAULT 'PUBLISHED',
ADD COLUMN     "target" "AnnouncementTarget" NOT NULL DEFAULT 'ALL',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "AnnouncementRead" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnnouncementRead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnnouncementRead_userId_idx" ON "AnnouncementRead"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AnnouncementRead_announcementId_userId_key" ON "AnnouncementRead"("announcementId", "userId");

-- CreateIndex
CREATE INDEX "Announcement_status_target_createdAt_idx" ON "Announcement"("status", "target", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Announcement_isPinned_createdAt_idx" ON "Announcement"("isPinned", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementRead" ADD CONSTRAINT "AnnouncementRead_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementRead" ADD CONSTRAINT "AnnouncementRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
