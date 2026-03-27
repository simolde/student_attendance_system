"use client";

import * as React from "react";
import { Printer } from "lucide-react";

type PrintButtonProps = {
  label?: string;
  className?: string;
};

export default function PrintButton({
  label = "Print",
  className,
}: PrintButtonProps) {
  const handlePrint = React.useCallback(() => {
    window.print();
  }, []);

  return (
    <button
      type="button"
      onClick={handlePrint}
      className={
        className ??
        "inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium shadow-sm transition hover:bg-accent hover:text-accent-foreground print:hidden"
      }
    >
      <Printer className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}