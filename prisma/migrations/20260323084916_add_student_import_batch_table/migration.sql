-- CreateTable
CREATE TABLE "StudentImportBatch" (
    "id" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "schoolYearId" TEXT,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "createdUsers" INTEGER NOT NULL DEFAULT 0,
    "createdStudents" INTEGER NOT NULL DEFAULT 0,
    "createdEnrollments" INTEGER NOT NULL DEFAULT 0,
    "updatedUsers" INTEGER NOT NULL DEFAULT 0,
    "updatedStudents" INTEGER NOT NULL DEFAULT 0,
    "updatedEnrollments" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentImportBatch_createdAt_idx" ON "StudentImportBatch"("createdAt");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "StudentImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentImportBatch" ADD CONSTRAINT "StudentImportBatch_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentImportBatch" ADD CONSTRAINT "StudentImportBatch_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "SchoolYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;
