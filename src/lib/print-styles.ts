export const PRINT_PAGE_STYLES = `
  * {
    box-sizing: border-box;
  }

  html,
  body {
    margin: 0;
    padding: 0;
  }

  body {
    font-family: Arial, Helvetica, sans-serif;
    color: #0f172a;
    background: #eef2f7;
    line-height: 1.45;
  }

  .print-screen-shell {
    min-height: 100vh;
    padding: 32px 24px 48px;
  }

  .print-topbar {
    max-width: 1100px;
    margin: 0 auto 20px;
  }

  .print-topbar__inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 18px 22px;
    border: 1px solid #dbe3ee;
    border-radius: 16px;
    background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
    box-shadow: 0 8px 28px rgba(15, 23, 42, 0.06);
  }

  .print-topbar__eyebrow {
    display: inline-block;
    margin-bottom: 4px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #64748b;
  }

  .print-topbar__title {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: #0f172a;
  }

  .print-paper {
    width: 100%;
    max-width: 1100px;
    margin: 0 auto;
    padding: 32px 34px 36px;
    border: 1px solid #dbe3ee;
    border-radius: 20px;
    background: #ffffff;
    box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
  }

  .print-header {
    margin-bottom: 20px;
    padding-bottom: 18px;
    border-bottom: 2px solid #e2e8f0;
  }

  .print-header__brand {
    margin-bottom: 10px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #475569;
  }

  .print-header__title,
  h1 {
    margin: 0 0 14px;
    font-size: 32px;
    line-height: 1.15;
    font-weight: 800;
    color: #0f172a;
  }

  .meta {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px 20px;
    margin-bottom: 16px;
    font-size: 13px;
    line-height: 1.6;
    color: #334155;
  }

  .meta strong {
    color: #0f172a;
  }

  .filters {
    margin: 16px 0 20px;
    padding: 14px 16px;
    border: 1px solid #dbe3ee;
    border-left: 4px solid #2563eb;
    background: #f8fbff;
    border-radius: 14px;
    font-size: 13px;
    color: #334155;
  }

  .filters__title {
    margin-bottom: 8px;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #1d4ed8;
  }

  .filters__content {
    display: grid;
    gap: 4px;
  }

  .summary-grid {
    display: grid;
    gap: 12px;
    margin: 18px 0;
  }

  .summary-grid.cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .summary-grid.cols-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .summary-card {
    min-height: 88px;
    padding: 14px 16px;
    border: 1px solid #dbe3ee;
    border-radius: 14px;
    background: #fcfdff;
  }

  .summary-card .label {
    margin-bottom: 10px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #64748b;
  }

  .summary-card .value {
    font-size: 28px;
    line-height: 1;
    font-weight: 800;
    color: #0f172a;
  }

  table {
    width: 100%;
    margin-top: 22px;
    border-collapse: collapse;
    font-size: 12px;
    background: #ffffff;
  }

  th,
  td {
    padding: 9px 10px;
    text-align: left;
    vertical-align: top;
  }

  thead th {
    border: 1px solid #cbd5e1;
    background: #f1f5f9;
    color: #0f172a;
    font-weight: 800;
  }

  tbody td {
    border: 1px solid #e2e8f0;
    color: #334155;
  }

  tbody tr:nth-child(even) {
    background: #fafcff;
  }

  .muted {
    color: #64748b;
    text-align: center;
    padding: 18px !important;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 84px;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.04em;
    border: 1px solid #cbd5e1;
  }

  .badge.active {
    background: #dcfce7;
    border-color: #bbf7d0;
    color: #166534;
  }

  .badge.archived {
    background: #fef3c7;
    border-color: #fde68a;
    color: #92400e;
  }

  .print-actions {
    margin-bottom: 18px;
  }

  .print-actions button,
  .print-topbar button {
    padding: 9px 14px;
    border: 1px solid #cbd5e1;
    background: #ffffff;
    border-radius: 10px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    color: #0f172a;
  }

  .print-actions button:hover,
  .print-topbar button:hover {
    background: #f8fafc;
  }

  @media (max-width: 900px) {
    .print-screen-shell {
      padding: 20px 14px 32px;
    }

    .print-paper {
      padding: 22px 18px 24px;
      border-radius: 16px;
    }

    .print-topbar__inner {
      flex-direction: column;
      align-items: flex-start;
    }

    .print-header__title,
    h1 {
      font-size: 28px;
    }

    .meta,
    .summary-grid.cols-3,
    .summary-grid.cols-4 {
      grid-template-columns: 1fr;
    }
  }

  @page {
    size: A4 portrait;
    margin: 12mm;
  }

  @media print {
    html,
    body {
      background: #ffffff !important;
    }

    body {
      margin: 0;
      color: #000000;
      font-size: 11px;
    }

    .print-topbar,
    .print-actions,
    .print\\:hidden {
      display: none !important;
    }

    .print-screen-shell {
      min-height: auto !important;
      padding: 0 !important;
    }

    .print-paper {
      width: 100% !important;
      max-width: none !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
      border-radius: 0 !important;
      background: #ffffff !important;
      box-shadow: none !important;
    }

    .print-header {
      margin-bottom: 14px;
      padding-bottom: 10px;
      border-bottom: 1px solid #94a3b8;
    }

    .print-header__brand {
      margin-bottom: 6px;
      font-size: 10px;
      color: #334155;
    }

    .print-header__title,
    h1 {
      margin: 0 0 10px;
      font-size: 22px;
      color: #000000;
    }

    .meta {
      gap: 4px 14px;
      margin-bottom: 12px;
      font-size: 11px;
      color: #111827;
    }

    .filters {
      margin: 12px 0;
      padding: 10px 12px;
      border: 1px solid #cbd5e1;
      border-left: 3px solid #475569;
      background: #ffffff;
      break-inside: avoid;
    }

    .filters__title {
      margin-bottom: 6px;
      font-size: 10px;
      color: #111827;
    }

    .filters__content {
      font-size: 11px;
      color: #111827;
    }

    .summary-grid {
      gap: 8px;
      margin: 12px 0;
      break-inside: avoid;
    }

    .summary-card {
      min-height: auto;
      padding: 10px 12px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      break-inside: avoid;
    }

    .summary-card .label {
      margin-bottom: 6px;
      font-size: 9px;
      color: #475569;
    }

    .summary-card .value {
      font-size: 18px;
      color: #000000;
    }

    table {
      margin-top: 14px;
      font-size: 10.5px;
      break-inside: auto;
    }

    thead {
      display: table-header-group;
    }

    tr,
    td,
    th {
      break-inside: avoid;
    }

    thead th {
      padding: 7px 8px;
      border: 1px solid #94a3b8;
      background: #f8fafc !important;
      color: #000000;
    }

    tbody td {
      padding: 7px 8px;
      border: 1px solid #cbd5e1;
      color: #111827;
    }

    tbody tr:nth-child(even) {
      background: transparent;
    }

    .badge {
      min-width: 72px;
      padding: 3px 8px;
      border: 1px solid #94a3b8;
      background: #ffffff !important;
      color: #111827 !important;
      font-size: 9px;
    }
  }
`;