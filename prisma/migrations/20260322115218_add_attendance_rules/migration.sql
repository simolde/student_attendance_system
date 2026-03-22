-- CreateTable
CREATE TABLE "AttendanceRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timeInStart" TEXT NOT NULL,
    "timeInEnd" TEXT NOT NULL,
    "lateAfter" TEXT NOT NULL,
    "timeOutStart" TEXT,
    "timeOutEnd" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRule_name_key" ON "AttendanceRule"("name");
