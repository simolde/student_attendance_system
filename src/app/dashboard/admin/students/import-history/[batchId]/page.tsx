import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import BatchDetailsActions from "./batch-details-actions";

const PAGE_SIZE = 20;

type PageProps = {
  params: Promise<{
    batchId: string;
  }>;
  searchParams: Promise<{
    q?: string;
    page?: string;
    sectionId?: string;
    rfidStatus?: string;
  }>;
};

function formatManilaDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function buildPageHref(
  batchId: string,
  values: {
    q?: string;
    page?: string | number;
    sectionId?: string;
    rfidStatus?: string;
  },
) {
  const params = new URLSearchParams();

  if (values.q?.trim()) params.set("q", values.q.trim());
  if (values.sectionId && values.sectionId !== "all") {
    params.set("sectionId", values.sectionId);
  }
  if (values.rfidStatus && values.rfidStatus !== "all") {
    params.set("rfidStatus", values.rfidStatus);
  }
  if (values.page && String(values.page) !== "1") {
    params.set("page", String(values.page));
  }

  const query = params.toString();

  return query
    ? `/dashboard/admin/students/import-history/${batchId}?${query}`
    : `/dashboard/admin/students/import-history/${batchId}`;
}

function buildPrintHref(
  batchId: string,
  values: {
    q?: string;
    page?: string | number;
    sectionId?: string;
    rfidStatus?: string;
  },
) {
  const params = new URLSearchParams();

  if (values.q?.trim()) params.set("q", values.q.trim());
  if (values.sectionId && values.sectionId !== "all") {
    params.set("sectionId", values.sectionId);
  }
  if (values.rfidStatus && values.rfidStatus !== "all") {
    params.set("rfidStatus", values.rfidStatus);
  }
  if (values.page && String(values.page) !== "1") {
    params.set("page", String(values.page));
  }

  const query = params.toString();

  return query
    ? `/dashboard/admin/students/import-history/${batchId}/print?${query}`
    : `/dashboard/admin/students/import-history/${batchId}/print`;
}

function buildExportHref(
  batchId: string,
  scope: "filtered" | "page",
  values: {
    q?: string;
    page?: string | number;
    sectionId?: string;
    rfidStatus?: string;
  },
) {
  const params = new URLSearchParams();

  params.set("batchId", batchId);
  params.set("scope", scope);

  if (values.q?.trim()) params.set("q", values.q.trim());
  if (values.sectionId && values.sectionId !== "all") {
    params.set("sectionId", values.sectionId);
  }
  if (values.rfidStatus && values.rfidStatus !== "all") {
    params.set("rfidStatus", values.rfidStatus);
  }
  if (scope === "page" && values.page) {
    params.set("page", String(values.page));
  }

  return `/api/students/export-batch-students?${params.toString()}`;
}

function buildPagePdfHref(
  batchId: string,
  values: {
    q?: string;
    page?: string | number;
    sectionId?: string;
    rfidStatus?: string;
  },
) {
  const params = new URLSearchParams();

  params.set("batchId", batchId);

  if (values.q?.trim()) params.set("q", values.q.trim());
  if (values.sectionId && values.sectionId !== "all") {
    params.set("sectionId", values.sectionId);
  }
  if (values.rfidStatus && values.rfidStatus !== "all") {
    params.set("rfidStatus", values.rfidStatus);
  }
  if (values.page) {
    params.set("page", String(values.page));
  }

  return `/api/students/export-batch-students-page-pdf?${params.toString()}`;
}

export default async function AdminStudentImportBatchDetailsPage({
  params,
  searchParams,
}: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasRole(session.user.role, [ROLES.SUPER_ADMIN, ROLES.ADMIN])) {
    redirect("/unauthorized");
  }

  const { batchId } = await params;
  const filters = await searchParams;

  const q = filters.q?.trim() ?? "";
  const sectionId = filters.sectionId?.trim() ?? "all";
  const rfidStatus = filters.rfidStatus?.trim() ?? "all";
  const page = Math.max(Number(filters.page || "1"), 1);

  const batch = await prisma.studentImportBatch.findUnique({
    where: { id: batchId },
    include: {
      schoolYear: {
        select: {
          id: true,
          name: true,
        },
      },
      createdByUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          students: true,
        },
      },
    },
  });

  if (!batch) {
    notFound();
  }

  const studentWhere = {
    importBatchId: batchId,
    ...(sectionId !== "all" ? { sectionId } : {}),
    ...(rfidStatus === "with-rfid"
      ? {
          rfidUid: {
            not: null,
          },
        }
      : rfidStatus === "without-rfid"
        ? {
            OR: [{ rfidUid: null }, { rfidUid: "" }],
          }
        : {}),
    ...(q
      ? {
          OR: [
            { id: { contains: q, mode: "insensitive" as const } },
            { studentNo: { contains: q, mode: "insensitive" as const } },
            { rfidUid: { contains: q, mode: "insensitive" as const } },
            {
              user: {
                name: { contains: q, mode: "insensitive" as const },
              },
            },
            {
              user: {
                email: { contains: q, mode: "insensitive" as const },
              },
            },
            {
              section: {
                name: { contains: q, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {}),
  };

  const [sections, totalStudents, students] = await Promise.all([
    prisma.section.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.student.count({
      where: studentWhere,
    }),
    prisma.student.findMany({
      where: studentWhere,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        section: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ studentNo: "asc" }, { createdAt: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(Math.ceil(totalStudents / PAGE_SIZE), 1);
  const currentSection = sections.find((item) => item.id === sectionId);

  const studentsOnPage = students.length;
  const withRfidOnPage = students.filter(
    (student) => !!student.rfidUid?.trim(),
  ).length;
  const withoutRfidOnPage = studentsOnPage - withRfidOnPage;

  const baseValues = {
    q,
    sectionId,
    rfidStatus,
  };

  const prevHref = buildPageHref(batchId, {
    ...baseValues,
    page: Math.max(page - 1, 1),
  });

  const nextHref = buildPageHref(batchId, {
    ...baseValues,
    page: Math.min(page + 1, totalPages),
  });

  const printPageHref = buildPrintHref(batchId, {
    ...baseValues,
    page,
  });

  const exportFilteredHref = buildExportHref(batchId, "filtered", {
    ...baseValues,
  });

  const exportPageHref = buildExportHref(batchId, "page", {
    ...baseValues,
    page,
  });
  
  const exportPagePdfHref = buildPagePdfHref(batchId, {
    q,
    sectionId,
    rfidStatus,
    page,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/dashboard/admin/students/import-history"
                className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
              >
                ← Back to Import History
              </Link>

              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  batch.isArchived
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {batch.isArchived ? "Archived Batch" : "Active Batch"}
              </span>
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Import Batch Details
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Review imported students, filters, and batch statistics.
              </p>
            </div>

            <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <span className="font-semibold text-slate-900">Batch ID:</span>{" "}
                {batch.id}
              </div>
              <div>
                <span className="font-semibold text-slate-900">
                  School Year:
                </span>{" "}
                {batch.schoolYear?.name ?? "-"}
              </div>
              <div>
                <span className="font-semibold text-slate-900">
                  Imported By:
                </span>{" "}
                {batch.createdByUser?.name ??
                  batch.createdByUser?.email ??
                  "-"}
              </div>
              <div>
                <span className="font-semibold text-slate-900">
                  Imported At:
                </span>{" "}
                {formatManilaDateTime(batch.createdAt)}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <BatchDetailsActions
              batchId={batch.id}
              isArchived={batch.isArchived}
              exportThisPageHref={exportPageHref}
              exportAllFilteredHref={exportFilteredHref}
              exportPagePdfHref={exportPagePdfHref}
              printViewHref={printPageHref}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Batch Students
          </p>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {batch._count.students}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Students on Page
          </p>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {studentsOnPage}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            With RFID
          </p>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {withRfidOnPage}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Without RFID
          </p>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {withoutRfidOnPage}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Total Rows
          </p>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {batch.totalRows}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Created Students
          </p>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {batch.createdStudents}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Updated Students
          </p>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {batch.updatedStudents}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Skipped
          </p>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {batch.skipped}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <form className="grid gap-4 lg:grid-cols-4 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <label
              htmlFor="q"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Search
            </label>
            <input
              id="q"
              name="q"
              defaultValue={q}
              placeholder="Student no, RFID, user, email, section..."
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400"
            />
          </div>

          <div>
            <label
              htmlFor="sectionId"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Section
            </label>
            <select
              id="sectionId"
              name="sectionId"
              defaultValue={sectionId}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400"
            >
              <option value="all">All Sections</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="rfidStatus"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              RFID Status
            </label>
            <select
              id="rfidStatus"
              name="rfidStatus"
              defaultValue={rfidStatus}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400"
            >
              <option value="all">All</option>
              <option value="with-rfid">With RFID</option>
              <option value="without-rfid">Without RFID</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Apply Filters
            </button>

            <Link
              href={`/dashboard/admin/students/import-history/${batchId}`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Reset
            </Link>
          </div>
        </form>

        {(q || sectionId !== "all" || rfidStatus !== "all") && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            {q ? (
              <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                Search: {q}
              </span>
            ) : null}

            {sectionId !== "all" ? (
              <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                Section: {currentSection?.name ?? sectionId}
              </span>
            ) : null}

            {rfidStatus !== "all" ? (
              <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                RFID:{" "}
                {rfidStatus === "with-rfid" ? "With RFID" : "Without RFID"}
              </span>
            ) : null}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Imported Students
            </h2>
            <p className="text-sm text-slate-600">
              Showing {(page - 1) * PAGE_SIZE + 1}-
              {Math.min(page * PAGE_SIZE, totalStudents)} of {totalStudents}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">
                  #
                </th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">
                  Student No
                </th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">
                  User
                </th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">
                  Email
                </th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">
                  Section
                </th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">
                  RFID UID
                </th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">
                  Created At
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {students.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-sm text-slate-500"
                  >
                    No students found for this batch and filter selection.
                  </td>
                </tr>
              ) : (
                students.map((student, index) => {
                  const rowNumber = (page - 1) * PAGE_SIZE + index + 1;

                  return (
                    <tr key={student.id} className="align-top">
                      <td className="px-6 py-4 text-slate-600">{rowNumber}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {student.studentNo}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {student.user?.name ?? "-"}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {student.user?.email ?? "-"}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {student.section?.name ?? "-"}
                      </td>
                      <td className="px-6 py-4">
                        {student.rfidUid?.trim() ? (
                          <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                            {student.rfidUid}
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            No RFID
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {formatManilaDateTime(student.createdAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            Page {page} of {totalPages}
          </p>

          <div className="flex gap-2">
            <Link
              href={prevHref}
              aria-disabled={page <= 1}
              className={`inline-flex items-center rounded-xl px-4 py-2 text-sm font-medium transition ${
                page <= 1
                  ? "pointer-events-none border border-slate-200 text-slate-300"
                  : "border border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              Previous
            </Link>

            <Link
              href={nextHref}
              aria-disabled={page >= totalPages}
              className={`inline-flex items-center rounded-xl px-4 py-2 text-sm font-medium transition ${
                page >= totalPages
                  ? "pointer-events-none border border-slate-200 text-slate-300"
                  : "border border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              Next
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}