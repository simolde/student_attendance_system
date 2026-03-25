export type RfidStatus = "" | "WITH_RFID" | "WITHOUT_RFID";

export function buildRfidCondition(rfidStatus: string) {
  if (rfidStatus === "WITH_RFID") {
    return {
      NOT: {
        rfidUid: null as string | null,
      },
    };
  }

  if (rfidStatus === "WITHOUT_RFID") {
    return {
      rfidUid: null as string | null,
    };
  }

  return {};
}

export function buildStudentSearchCondition(q: string) {
  if (!q) return {};

  return {
    OR: [
      { studentNo: { contains: q, mode: "insensitive" as const } },
      { rfidUid: { contains: q, mode: "insensitive" as const } },
      { user: { name: { contains: q, mode: "insensitive" as const } } },
      { user: { email: { contains: q, mode: "insensitive" as const } } },
      { section: { name: { contains: q, mode: "insensitive" as const } } },
    ],
  };
}

export function buildStudentsWhere({
  q = "",
  sectionId = "",
  importBatchId = "",
  rfidStatus = "",
}: {
  q?: string;
  sectionId?: string;
  importBatchId?: string;
  rfidStatus?: string;
}) {
  return {
    AND: [
      sectionId ? { sectionId } : {},
      importBatchId ? { importBatchId } : {},
      buildRfidCondition(rfidStatus),
      buildStudentSearchCondition(q),
    ],
  };
}

export function buildBatchStudentsWhere({
  batchId,
  q = "",
  sectionId = "",
  rfidStatus = "",
}: {
  batchId: string;
  q?: string;
  sectionId?: string;
  rfidStatus?: string;
}) {
  return {
    AND: [
      { importBatchId: batchId },
      sectionId ? { sectionId } : {},
      buildRfidCondition(rfidStatus),
      buildStudentSearchCondition(q),
    ],
  };
}