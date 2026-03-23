-- AlterTable
ALTER TABLE "StudentImportBatch" ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "StudentImportBatch_isArchived_createdAt_idx" ON "StudentImportBatch"("isArchived", "createdAt");
