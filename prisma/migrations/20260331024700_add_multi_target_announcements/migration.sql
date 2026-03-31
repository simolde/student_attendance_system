/*
  Warnings:

  - You are about to drop the column `target` on the `Announcement` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Announcement_status_target_createdAt_idx";

-- AlterTable
ALTER TABLE "Announcement" DROP COLUMN "target",
ADD COLUMN     "targets" "AnnouncementTarget"[] DEFAULT ARRAY['ALL']::"AnnouncementTarget"[];

-- CreateIndex
CREATE INDEX "Announcement_status_createdAt_idx" ON "Announcement"("status", "createdAt" DESC);
