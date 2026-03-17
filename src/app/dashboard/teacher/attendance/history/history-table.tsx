"use client";

import { useActionState } from "react";
import { updateAttendanceRecord, type AttendanceUpdateState } from "./actions";
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

const initialState: AttendanceUpdateState = {};

type AttendanceRow = {
  id: string;
  date: string;
  status: string;
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

function AttendanceEditForm({ record }: { record: AttendanceRow }) {
  const [state, formAction, pending] = useActionState(
    updateAttendanceRecord,
    initialState
  );

  return (
    <>
      <TableRow>
        <TableCell>{record.student.studentNo}</TableCell>
        <TableCell>{record.student.user.name ?? record.student.user.email}</TableCell>
        <TableCell>{record.student.section?.name ?? "-"}</TableCell>
        <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
        <TableCell>
          <form action={formAction} className="flex flex-col gap-2">
            <input type="hidden" name="attendanceId" value={record.id} />

            <select
              name="status"
              defaultValue={record.status}
              className="rounded-md border bg-background px-2 py-1 text-sm"
            >
              <option value="PRESENT">PRESENT</option>
              <option value="LATE">LATE</option>
              <option value="ABSENT">ABSENT</option>
              <option value="EXCUSED">EXCUSED</option>
            </select>

            <Input
              name="remarks"
              defaultValue={record.remarks ?? ""}
              placeholder="Optional remarks"
            />

            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Saving..." : "Save"}
            </Button>

            {state?.error ? (
              <p className="mt-2 text-xs text-destructive">{state.error}</p>
            ) : null}

            {state?.success ? (
              <p className="mt-2 text-xs text-green-600">{state.success}</p>
            ) : null}
          </form>
        </TableCell>
      </TableRow>
    </>
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
          <AttendanceEditForm key={record.id} record={record} />
        ))}
      </TableBody>
    </Table>
  );
}