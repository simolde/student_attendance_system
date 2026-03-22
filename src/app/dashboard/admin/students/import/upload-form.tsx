"use client";

import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { importStudentsFromRows, type ImportRow } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type ImportSummary = {
  createdUsers: number;
  createdStudents: number;
  createdEnrollments: number;
  updatedUsers: number;
  updatedEnrollments: number;
  skipped: number;
  errors: string[];
};

export default function ImportStudentsForm() {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [pending, setPending] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const previewRows = useMemo(() => rows.slice(0, 10), [rows]);

  async function handleFileChange(file: File | undefined) {
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });

      const preferredSheetName =
      workbook.SheetNames.find(
        (name) => name.trim().toLowerCase() === "students"
      ) ?? workbook.SheetNames[0];

      const sheet = workbook.Sheets[preferredSheetName];

      // Read from row 4 where the real table headers begin.
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
        range: 3,
      });

      const mappedRows: ImportRow[] = json
        .map((row) => ({
          student_no: String(row.student_no ?? "").trim(),
          full_name: String(row.full_name ?? "").trim(),
          email: String(row.email ?? "").trim(),
          section: String(row.section ?? "").trim(),
          grade_level: String(row.grade_level ?? "").trim(),
          school_year: String(row.school_year ?? "").trim(),
          status: String(row.status ?? "").trim(),
          rfid_uid: String(row.rfid_uid ?? "").trim(),
        }))
        .filter(
          (row) =>
            row.student_no ||
            row.full_name ||
            row.email ||
            row.section ||
            row.grade_level ||
            row.school_year ||
            row.status ||
            row.rfid_uid
        );

        setRows(mappedRows);
        setFileName(file.name);
        setSummary(null);

        toast.success(
        `Loaded ${mappedRows.length} row(s) from sheet "${preferredSheetName}"`
        );
    } catch (error) {
        console.error(error);
        toast.error("Failed to read Excel file");
    }
  }

  async function handleImport() {
    if (!rows.length) {
      toast.error("Please upload an Excel file first");
      return;
    }

    setPending(true);
    setSummary(null);

    const result = await importStudentsFromRows(rows);

    setPending(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (result.summary) {
      setSummary(result.summary);
    }

    if (result.success) {
      toast.success(result.success);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <label className="mb-2 block text-sm font-medium">Upload Excel File</label>
        <Input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => handleFileChange(e.target.files?.[0])}
        />
        <p className="mt-2 text-xs text-slate-600">
          Use columns: student_no, full_name, email, section, grade_level, school_year, status, rfid_uid
        </p>
      </div>

      {fileName ? (
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-sm font-medium text-slate-900">Loaded File</p>
          <p className="mt-1 text-sm text-slate-600">{fileName}</p>
          <p className="mt-1 text-xs text-slate-500">{rows.length} row(s) ready for import</p>
        </div>
      ) : null}

      {previewRows.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="border-b bg-slate-50 px-4 py-3">
            <p className="text-sm font-medium text-slate-900">Preview</p>
            <p className="text-xs text-slate-500">Showing first 10 rows</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Student No</th>
                  <th className="px-4 py-3 text-left font-medium">Full Name</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Section</th>
                  <th className="px-4 py-3 text-left font-medium">Grade Level</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-4 py-3">{row.student_no}</td>
                    <td className="px-4 py-3">{row.full_name}</td>
                    <td className="px-4 py-3">{row.email}</td>
                    <td className="px-4 py-3">{row.section}</td>
                    <td className="px-4 py-3">{row.grade_level}</td>
                    <td className="px-4 py-3">{row.status || "ENROLLED"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button onClick={handleImport} disabled={pending || rows.length === 0}>
          {pending ? "Importing..." : "Import Students"}
        </Button>
      </div>

      {summary ? (
        <div className="space-y-4 rounded-xl border border-slate-200 p-4">
          <p className="text-sm font-semibold text-slate-900">Import Summary</p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <SummaryItem label="Created Users" value={summary.createdUsers} />
            <SummaryItem label="Created Students" value={summary.createdStudents} />
            <SummaryItem label="Created Enrollments" value={summary.createdEnrollments} />
            <SummaryItem label="Updated Users" value={summary.updatedUsers} />
            <SummaryItem label="Updated Enrollments" value={summary.updatedEnrollments} />
            <SummaryItem label="Skipped" value={summary.skipped} />
          </div>

          {summary.errors.length > 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-medium text-amber-900">Warnings / Errors</p>
              <ul className="mt-2 space-y-1 text-xs text-amber-800">
                {summary.errors.slice(0, 20).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}