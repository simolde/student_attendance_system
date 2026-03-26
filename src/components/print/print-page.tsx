import { ReactNode } from "react";

export function PrintPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <html>
      <head>
        <title>{title}</title>
      </head>
      <body>
        <div className="print-actions">
          <button onClick={() => window.print()}>Print</button>
        </div>
        {children}
      </body>
    </html>
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
    <>
      <h1>{title}</h1>
      {meta ? <div className="meta">{meta}</div> : null}
    </>
  );
}

export function PrintFilters({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="filters">
      <div>
        <strong>Applied Filters</strong>
      </div>
      {children}
    </div>
  );
}

export function PrintSummaryGrid({
  columns = 3,
  children,
}: {
  columns?: 3 | 4;
  children: ReactNode;
}) {
  return <div className={`summary-grid cols-${columns}`}>{children}</div>;
}

export function PrintSummaryCard({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="summary-card">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}