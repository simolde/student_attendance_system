"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  deleteAttendanceRecord,
  type AttendanceUpdateState,
  updateAttendanceRecord,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import ConfirmActionDialog from "@/components/confirm-action-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const initialState: AttendanceUpdateState = {};

type AttendanceRow = {
  id: string;
  date: string;
  status: "PRESENT" | "LATE" | "ABSENT" | "EXCUSED";
  source: "MANUAL" | "RFID" | "IMPORT";
  remarks: string | null;
  timeIn: string | null;
  timeOut: string | null;
  student: {
    studentNo: string;
    user: {
      name: string | null;
      email: string;
    };
    section: {
      name: string;
    } | null;
  };
};

function getStatusBadgeClass(status: AttendanceRow["status"]) {
  switch (status) {
    case "PRESENT":
      return "border-green-200 bg-green-50 text-green-700";
    case "LATE":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "ABSENT":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "EXCUSED":
      return "border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function getSourceBadgeClass(source: AttendanceRow["source"]) {
  switch (source) {
    case "MANUAL":
      return "border-slate-200 bg-slate-50 text-slate-700";
    case "RFID":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "IMPORT":
      return "border-cyan-200 bg-cyan-50 text-cyan-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function formatTime(value: string | null) {
  return value ?? "-";
}

function AttendanceEditRow({ record }: { record: AttendanceRow }) {
  const [status, setStatus] = useState(record.status);
  const [remarks, setRemarks] = useState(record.remarks ?? "");

  const [updateState, updateAction, updatePending] = useActionState(
    updateAttendanceRecord,
    initialState
  );

  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteAttendanceRecord,
    initialState
  );

  useEffect(() => {
    if (updateState?.error) toast.error(updateState.error);
    if (updateState?.success) toast.success(updateState.success);
  }, [updateState]);

  useEffect(() => {
    if (deleteState?.error) toast.error(deleteState.error);
    if (deleteState?.success) toast.success(deleteState.success);
  }, [deleteState]);

  const isDirty = useMemo(() => {
    return status !== record.status || remarks !== (record.remarks ?? "");
  }, [status, remarks, record.status, record.remarks]);

  return (
    <TableRow className="align-top">
      <TableCell className="font-medium text-slate-900">
        {record.student.studentNo}
      </TableCell>

      <TableCell>
        <div className="space-y-0.5">
          <div className="font-medium text-slate-900">
            {record.student.user.name ?? "-"}
          </div>
          <div className="text-xs text-slate-500">{record.student.user.email}</div>
        </div>
      </TableCell>

      <TableCell>{record.student.section?.name ?? "-"}</TableCell>
      <TableCell>{record.date}</TableCell>
      <TableCell>{formatTime(record.timeIn)}</TableCell>
      <TableCell>{formatTime(record.timeOut)}</TableCell>

      <TableCell>
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getSourceBadgeClass(
            record.source
          )}`}
        >
          {record.source}
        </span>
      </TableCell>

      <TableCell>
        <select
          value={status}
          onChange={(e) =>
            setStatus(
              e.target.value as "PRESENT" | "LATE" | "ABSENT" | "EXCUSED"
            )
          }
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300"
        >
          <option value="PRESENT">PRESENT</option>
          <option value="LATE">LATE</option>
          <option value="ABSENT">ABSENT</option>
          <option value="EXCUSED">EXCUSED</option>
        </select>

        <div className="mt-2">
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(
              status
            )}`}
          >
            {status}
          </span>
        </div>
      </TableCell>

      <TableCell>
        <Input
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Optional remarks"
          className="h-10 min-w-45 rounded-xl"
        />
      </TableCell>

      <TableCell>
        <div className="flex min-w-30 flex-col gap-2">
          <form action={updateAction}>
            <input type="hidden" name="attendanceId" value={record.id} />
            <input type="hidden" name="status" value={status} />
            <input type="hidden" name="remarks" value={remarks} />

            <Button
              type="submit"
              size="sm"
              disabled={updatePending || !isDirty}
              className="w-full rounded-xl"
            >
              {updatePending ? "Saving..." : "Save"}
            </Button>
          </form>

          <form action={deleteAction} id={`delete-attendance-${record.id}`}>
            <input type="hidden" name="attendanceId" value={record.id} />
          </form>

          <ConfirmActionDialog
            formId={`delete-attendance-${record.id}`}
            title="Delete attendance record?"
            description="This will permanently remove the attendance record."
            actionLabel={deletePending ? "Deleting..." : "Delete"}
            trigger={
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={deletePending}
                className="w-full rounded-xl"
              >
                Delete
              </Button>
            }
          />
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function AttendanceHistoryTable({
  records,
}: {
  records: AttendanceRow[];
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead>Student No</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time In</TableHead>
              <TableHead>Time Out</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead className="w-35">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No attendance records found.
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <AttendanceEditRow key={record.id} record={record} />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}