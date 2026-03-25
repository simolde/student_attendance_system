"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Printer, ChevronDown, FileText } from "lucide-react";

type MenuItem = {
  label: string;
  href: string;
  icon?: "print" | "csv" | "pdf";
  newTab?: boolean;
};

export default function ExportActionsMenu({
  label = "Export / Print",
  items,
}: {
  label?: string;
  items: MenuItem[];
}) {
  function renderIcon(icon?: MenuItem["icon"]) {
    if (icon === "print") return <Printer className="mr-2 h-4 w-4" />;
    if (icon === "pdf") return <FileText className="mr-2 h-4 w-4" />;
    return <Download className="mr-2 h-4 w-4" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          {label}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {items.map((item) => (
          <DropdownMenuItem key={item.label} asChild>
            <a
              href={item.href}
              target={item.newTab ? "_blank" : undefined}
              rel={item.newTab ? "noreferrer" : undefined}
            >
              {renderIcon(item.icon)}
              {item.label}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}