"use client";

import Link from "next/link";
import {
  MoreHorizontal,
  Download,
  Eye,
  Archive,
  ArchiveRestore,
  FileText,
  Printer,
  FileDown,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toggleImportBatchArchive } from "../actions";

type Props = {
  batchId: string;
  isArchived: boolean;
  exportThisPageHref: string;
  exportAllFilteredHref: string;
  exportPagePdfHref: string;
  printViewHref: string;
};

export default function BatchDetailsActions({
  batchId,
  isArchived,
  exportThisPageHref,
  exportAllFilteredHref,
  exportPagePdfHref,
  printViewHref,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        asChild
        variant="outline"
        size="sm"
        className="h-9 rounded-xl border-slate-200 bg-white px-3 text-slate-700 shadow-sm hover:bg-slate-50"
      >
        <Link
          href={`/dashboard/admin/students?importBatchId=${encodeURIComponent(
            batchId,
          )}&page=1`}
        >
          View in Students Page
        </Link>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-xl border-slate-200 bg-white px-3 text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-64 rounded-2xl border-slate-200 p-2 shadow-xl"
        >
          <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Batch Actions
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <a
              href={`/api/students/export-batch?importBatchId=${encodeURIComponent(
                batchId,
              )}`}
              className="flex items-center gap-2 rounded-xl"
            >
              <Download className="h-4 w-4" />
              <span>Export Full Batch CSV</span>
            </a>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <a
              href={exportThisPageHref}
              className="flex items-center gap-2 rounded-xl"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Export CSV (This Page)</span>
            </a>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <a
              href={exportAllFilteredHref}
              className="flex items-center gap-2 rounded-xl"
            >
              <FileText className="h-4 w-4" />
              <span>Export CSV (Filtered)</span>
            </a>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <a
              href={exportPagePdfHref}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-xl"
            >
              <FileDown className="h-4 w-4" />
              <span>Export PDF (This Page)</span>
            </a>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <a
              href={printViewHref}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-xl"
            >
              <Printer className="h-4 w-4" />
              <span>Open Print View</span>
            </a>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <Link
              href={`/dashboard/admin/students/import-history/${encodeURIComponent(
                batchId,
              )}`}
              className="flex items-center gap-2 rounded-xl"
            >
              <Eye className="h-4 w-4" />
              <span>Reload Details</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <form action={toggleImportBatchArchive} className="w-full">
              <input type="hidden" name="batchId" value={batchId} />
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-xl"
              >
                {isArchived ? (
                  <ArchiveRestore className="h-4 w-4" />
                ) : (
                  <Archive className="h-4 w-4" />
                )}
                <span>{isArchived ? "Unarchive Batch" : "Archive Batch"}</span>
              </button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}