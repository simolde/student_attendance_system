"use client";

import {
  MoreHorizontal,
  Download,
  FileText,
  Printer,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  printViewHref: string;
  exportThisPageHref: string;
  exportAllFilteredHref?: string;
  exportCredentialsHref?: string;
  disableExportCredentials?: boolean;
};

export default function StudentsPageActions({
  printViewHref,
  exportThisPageHref,
  exportAllFilteredHref,
  exportCredentialsHref,
  disableExportCredentials = false,
}: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <MoreHorizontal className="mr-2 h-4 w-4" />
          Actions
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem asChild>
          <a href={printViewHref} target="_blank" rel="noreferrer">
            <Printer className="mr-2 h-4 w-4" />
            Print View
          </a>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <a href={exportThisPageHref}>
            <FileText className="mr-2 h-4 w-4" />
            Export This Page
          </a>
        </DropdownMenuItem>

        {exportAllFilteredHref ? (
          <DropdownMenuItem asChild>
            <a href={exportAllFilteredHref}>
              <Users className="mr-2 h-4 w-4" />
              Export All Filtered
            </a>
          </DropdownMenuItem>
        ) : null}

        {exportCredentialsHref ? (
          disableExportCredentials ? (
            <DropdownMenuItem disabled>
              <Download className="mr-2 h-4 w-4" />
              Export Credentials Disabled
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem asChild>
              <a href={exportCredentialsHref}>
                <Download className="mr-2 h-4 w-4" />
                Export Credentials
              </a>
            </DropdownMenuItem>
          )
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}