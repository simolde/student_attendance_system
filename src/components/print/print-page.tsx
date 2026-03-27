import { ReactNode } from "react";
import { PrintButton } from "@/components/print/print-button";
import { PRINT_PAGE_STYLES } from "@/lib/print-styles";

export function PrintPage({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="print-screen-shell">
      <style suppressHydrationWarning>{PRINT_PAGE_STYLES}</style>

      <div className="print-topbar print:hidden">
        <div className="print-topbar__inner">
          <div className="print-topbar__text">
            <span className="print-topbar__eyebrow">Print Preview</span>
            <h2 className="print-topbar__title">Student Attendance Report</h2>
          </div>

          <PrintButton />
        </div>
      </div>

      <div className="print-paper">{children}</div>
    </div>
  );
}

export function PrintTitle({
  title,
  meta,
}: {
  title: string;
  meta?: ReactNode;
}) {
  return (
    <header className="print-header">
      <div className="print-header__brand">Student Attendance System</div>
      <h1 className="print-header__title">{title}</h1>
      {meta ? <div className="meta">{meta}</div> : null}
    </header>
  );
}

export function PrintFilters({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <section className="filters">
      <div className="filters__title">Applied Filters</div>
      <div className="filters__content">{children}</div>
    </section>
  );
}

export function PrintSummaryGrid({
  columns = 3,
  children,
}: {
  columns?: 3 | 4;
  children: ReactNode;
}) {
  return <section className={`summary-grid cols-${columns}`}>{children}</section>;
}

export function PrintSummaryCard({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <article className="summary-card">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </article>
  );
}