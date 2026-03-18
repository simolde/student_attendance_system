"use client";

import { useActionState, useState } from "react";
import {
  updateAttendanceRecord,
  deleteAttendanceRecord,
  type AttendanceUpdateState,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ConfirmActionDialog from "@/components/confirm-action-dialog";

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

  return (
    <TableRow>
      <TableCell>{record.student.studentNo}</TableCell>
      <TableCell>{record.student.user.name ?? record.student.user.email}</TableCell>
      <TableCell>{record.student.section?.name ?? "-"}</TableCell>
      <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>

      <TableCell>
        <select
          value={status}
          onChange={(e) =>
            setStatus(e.target.value as "PRESENT" | "LATE" | "ABSENT" | "EXCUSED")
          }
          className="rounded-md border bg-background px-2 py-1 text-sm"
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
        />
      </TableCell>

      <TableCell>
        <form action={updateAction} className="space-y-2">
          <input type="hidden" name="attendanceId" value={record.id} />
          <input type="hidden" name="status" value={status} />
          <input type="hidden" name="remarks" value={remarks} />

          <Button type="submit" size="sm" disabled={updatePending}>
            {updatePending ? "Saving..." : "Save"}
          </Button>
        </form>

        {updateState?.error ? (
          <p className="mt-2 text-xs text-destructive">{updateState.error}</p>
        ) : null}

        {updateState?.success ? (
          <p className="mt-2 text-xs text-green-600">{updateState.success}</p>
        ) : null}

        <form action={deleteAction} id={`delete-attendance-${record.id}`} className="mt-2">
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
              className="mt-2"
            >
              Delete
            </Button>
          }
        />

        {deleteState?.error ? (
          <p className="mt-2 text-xs text-destructive">{deleteState.error}</p>
        ) : null}

        {deleteState?.success ? (
          <p className="mt-2 text-xs text-green-600">{deleteState.success}</p>
        ) : null}
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Student No</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Section</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Remarks</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {records.map((record) => (
          <AttendanceEditRow key={record.id} record={record} />
        ))}
      </TableBody>
    </Table>
  );
}