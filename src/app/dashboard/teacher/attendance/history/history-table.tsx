"use client";

import { useActionState, useEffect, useState } from "react";
import {
  updateAttendanceRecord,
  deleteAttendanceRecord,
  type AttendanceUpdateState,
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
  remarks: string | null;
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

  return (
    <TableRow className="align-top">
      <TableCell className="font-medium text-slate-900">
        {record.student.studentNo}
      </TableCell>
      <TableCell>{record.student.user.name ?? record.student.user.email}</TableCell>
      <TableCell>{record.student.section?.name ?? "-"}</TableCell>
      <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>

      <TableCell>
        <select
          value={status}
          onChange={(e) =>
            setStatus(e.target.value as "PRESENT" | "LATE" | "ABSENT" | "EXCUSED")
          }
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="PRESENT">PRESENT</option>
          <option value="LATE">LATE</option>
          <option value="ABSENT">ABSENT</option>
          <option value="EXCUSED">EXCUSED</option>
        </select>
      </TableCell>

      <TableCell>
        <Input
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Optional remarks"
          className="h-10"
        />
      </TableCell>

      <TableCell>
        <div className="flex flex-col gap-2">
          <form action={updateAction}>
            <input type="hidden" name="attendanceId" value={record.id} />
            <input type="hidden" name="status" value={status} />
            <input type="hidden" name="remarks" value={remarks} />

            <Button type="submit" size="sm" disabled={updatePending} className="w-full">
              {updatePending ? "Saving..." : "Save"}
            </Button>
          </form>

          <form action={deleteAction} id={`delete-attendance-${record.id}`}>
            <input type="hidden" name="attendanceId" value={record.id} />
          </form>

          <ConfirmActionDialog
            formId={`delete-attendance-${record.id}`}
            title="Delete attendance record?"
            description="This action will permanently remove this attendance record."
            actionLabel={deletePending ? "Deleting..." : "Delete"}
            trigger={
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={deletePending}
                className="w-full"
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
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/80">
            <TableHead>Student No</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Section</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Remarks</TableHead>
            <TableHead className="w-[140px]">Action</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {records.map((record) => (
            <AttendanceEditRow key={record.id} record={record} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}