import type { ReactNode } from "react";
import PrintButton from "./print-button";

type PrintPageProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
};

export default function PrintPage({
  title,
  subtitle,
  children,
  actions,
}: PrintPageProps) {
  return (
    <div className="min-h-screen bg-muted/30 print:min-h-0 print:bg-white">
      <div className="mx-auto w-full max-w-300 p-4 sm:p-6 lg:p-8 print:max-w-none print:p-0">
        <div className="mb-6 flex items-start justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {subtitle ? (
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            {actions}
            <PrintButton />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border bg-background shadow-sm print:rounded-none print:border-0 print:shadow-none">
          <div className="p-4 sm:p-6 print:p-0">{children}</div>
        </div>
      </div>
    </div>
  );
}