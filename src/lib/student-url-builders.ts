type Primitive = string | number | boolean | null | undefined;

type Params = Record<string, Primitive>;

export function buildQueryString(params: Params) {
  const sp = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    sp.set(key, String(value));
  }

  return sp.toString();
}

export function buildPathWithQuery(path: string, params: Params) {
  const qs = buildQueryString(params);
  return qs ? `${path}?${qs}` : path;
}

export function buildStudentsPageUrl(params: {
  q?: string;
  sectionId?: string;
  importBatchId?: string;
  rfidStatus?: string;
  page?: number | string;
}) {
  return buildPathWithQuery("/dashboard/admin/students", params);
}

export function buildStudentsPrintUrl(params: {
  q?: string;
  sectionId?: string;
  importBatchId?: string;
  rfidStatus?: string;
  page?: number | string;
}) {
  return buildPathWithQuery("/dashboard/admin/students/print", params);
}

export function buildStudentsExportUrl(params: {
  q?: string;
  sectionId?: string;
  importBatchId?: string;
  rfidStatus?: string;
}) {
  return buildPathWithQuery("/api/students/export-students-view", params);
}

export function buildStudentsPageExportUrl(params: {
  q?: string;
  sectionId?: string;
  importBatchId?: string;
  rfidStatus?: string;
  page?: number | string;
}) {
  return buildPathWithQuery("/api/students/export-students-view-page", params);
}

export function buildImportHistoryUrl(params: {
  archived?: string;
  q?: string;
  dateFrom?: string;
  dateTo?: string;
  schoolYearId?: string;
  sectionId?: string;
  createdByUserId?: string;
  page?: number | string;
}) {
  return buildPathWithQuery("/dashboard/admin/students/import-history", params);
}

export function buildImportHistoryPrintUrl(params: {
  archived?: string;
  q?: string;
  dateFrom?: string;
  dateTo?: string;
  schoolYearId?: string;
  sectionId?: string;
  createdByUserId?: string;
  page?: number | string;
}) {
  return buildPathWithQuery(
    "/dashboard/admin/students/import-history/print",
    params
  );
}

export function buildImportHistoryExportUrl(params: {
  archived?: string;
  q?: string;
  dateFrom?: string;
  dateTo?: string;
  schoolYearId?: string;
  sectionId?: string;
  createdByUserId?: string;
}) {
  return buildPathWithQuery("/api/students/export-import-history", params);
}

export function buildImportHistoryPageExportUrl(params: {
  archived?: string;
  q?: string;
  dateFrom?: string;
  dateTo?: string;
  schoolYearId?: string;
  sectionId?: string;
  createdByUserId?: string;
  page?: number | string;
}) {
  return buildPathWithQuery(
    "/api/students/export-import-history-page",
    params
  );
}

export function buildBatchDetailsUrl(
  batchId: string,
  params: {
    q?: string;
    sectionId?: string;
    rfidStatus?: string;
    page?: number | string;
  }
) {
  return buildPathWithQuery(
    `/dashboard/admin/students/import-history/${encodeURIComponent(batchId)}`,
    params
  );
}

export function buildBatchPrintUrl(
  batchId: string,
  params: {
    q?: string;
    sectionId?: string;
    rfidStatus?: string;
    page?: number | string;
  }
) {
  return buildPathWithQuery(
    `/dashboard/admin/students/import-history/${encodeURIComponent(
      batchId
    )}/print`,
    params
  );
}

export function buildBatchExportUrl(params: {
  batchId: string;
  q?: string;
  sectionId?: string;
  rfidStatus?: string;
}) {
  return buildPathWithQuery("/api/students/export-batch-students", params);
}

export function buildBatchPageExportUrl(params: {
  batchId: string;
  q?: string;
  sectionId?: string;
  rfidStatus?: string;
  page?: number | string;
}) {
  return buildPathWithQuery("/api/students/export-batch-students-page", params);
}