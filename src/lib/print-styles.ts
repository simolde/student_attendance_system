export const PRINT_PAGE_STYLES = `
  * { box-sizing: border-box; }

  body {
    font-family: Arial, Helvetica, sans-serif;
    margin: 24px;
    color: #0f172a;
  }

  h1 {
    margin: 0 0 8px 0;
    font-size: 24px;
  }

  .meta {
    margin-bottom: 16px;
    font-size: 13px;
    line-height: 1.6;
  }

  .filters {
    margin: 16px 0 20px;
    padding: 12px;
    border: 1px solid #cbd5e1;
    background: #f8fafc;
    border-radius: 8px;
    font-size: 12px;
  }

  .summary-grid {
    display: grid;
    gap: 12px;
    margin-bottom: 20px;
  }

  .summary-grid.cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .summary-grid.cols-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .summary-card {
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 12px;
    background: #fff;
  }

  .summary-card .label {
    font-size: 11px;
    color: #475569;
    margin-bottom: 6px;
  }

  .summary-card .value {
    font-size: 18px;
    font-weight: bold;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }

  th, td {
    border: 1px solid #cbd5e1;
    padding: 8px;
    text-align: left;
    vertical-align: top;
  }

  th {
    background: #e2e8f0;
  }

  .muted {
    color: #475569;
  }

  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: bold;
    border: 1px solid #cbd5e1;
  }

  .badge.active {
    background: #dbeafe;
    color: #1e3a8a;
  }

  .badge.archived {
    background: #f1f5f9;
    color: #334155;
  }

  .print-actions {
    margin-bottom: 18px;
  }

  .print-actions button {
    padding: 8px 12px;
    border: 1px solid #cbd5e1;
    background: white;
    border-radius: 8px;
    cursor: pointer;
  }

  @media print {
    .print-actions {
      display: none;
    }

    body {
      margin: 0;
    }
  }
`;