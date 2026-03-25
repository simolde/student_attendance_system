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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toggleImportBatchArchive } from "../actions";

type Props = {
  batchId: string;
  isArchived: boolean;
  exportThisPageHref: string;
  exportAllFilteredHref: string;
  printViewHref: string;
};

export default function BatchDetailsActions({
  batchId,
  isArchived,
  exportThisPageHref,
  exportAllFilteredHref,
  printViewHref,
}: Props) {
  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="outline" size="sm">
        <Link
          href={`/dashboard/admin/students?importBatchId=${encodeURIComponent(
            batchId
          )}&page=1`}
        >
          View in Students Page
        </Link>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem asChild>
            <a
              href={`/api/students/export-batch?importBatchId=${encodeURIComponent(
                batchId
              )}`}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Batch
            </a>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <a href={exportThisPageHref}>
              <FileText className="mr-2 h-4 w-4" />
              Export This Page
            </a>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <a href={exportAllFilteredHref}>
              <Download className="mr-2 h-4 w-4" />
              Export All Filtered
            </a>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <a href={printViewHref} target="_blank" rel="noreferrer">
              <Printer className="mr-2 h-4 w-4" />
              Print View
            </a>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link
              href={`/dashboard/admin/students/import-history/${encodeURIComponent(
                batchId
              )}`}
            >
              <Eye className="mr-2 h-4 w-4" />
              Reload Details
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <form action={toggleImportBatchArchive} className="w-full">
              <input type="hidden" name="batchId" value={batchId} />
              <button type="submit" className="flex w-full items-center">
                {isArchived ? (
                  <ArchiveRestore className="mr-2 h-4 w-4" />
                ) : (
                  <Archive className="mr-2 h-4 w-4" />
                )}
                {isArchived ? "Unarchive Batch" : "Archive Batch"}
              </button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}