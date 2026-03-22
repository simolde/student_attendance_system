"use client";

import { useActionState, useEffect, useState } from "react";
import { assignStudentRfid, type StudentRfidFormState, clearStudentRfid } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ConfirmActionDialog from "@/components/confirm-action-dialog";

const initialState: StudentRfidFormState = {};

type StudentRow = {
  id: string;
  studentNo: string;
  rfidUid: string | null;
  sectionName: string | null;
  user: {
    name: string | null;
    email: string;
  };
};

function StudentRfidRow({ student }: { student: StudentRow }) {
  const [rfidUid, setRfidUid] = useState(student.rfidUid ?? "");

  const [assignState, assignAction, assignPending] = useActionState(
    assignStudentRfid,
    initialState
  );

  useEffect(() => {
    if (assignState?.error) toast.error(assignState.error);
    if (assignState?.success) toast.success(assignState.success);
  }, [assignState]);

  return (
    <tr className="border-t align-top">
      <td className="px-4 py-3 font-medium text-slate-900">{student.studentNo}</td>
      <td className="px-4 py-3">
        <div className="space-y-1">
          <p className="font-medium text-slate-900">{student.user.name ?? "-"}</p>
          <p className="text-sm text-slate-500">{student.user.email}</p>
        </div>
      </td>
      <td className="px-4 py-3 text-slate-700">{student.sectionName ?? "-"}</td>
      <td className="px-4 py-3">
        <form action={assignAction} className="flex flex-col gap-2 sm:flex-row">
          <input type="hidden" name="studentId" value={student.id} />
          <Input
            name="rfidUid"
            value={rfidUid}
            onChange={(e) => setRfidUid(e.target.value)}
            placeholder="Enter RFID UID"
            className="h-10"
          />
          <Button type="submit" size="sm" disabled={assignPending}>
            {assignPending ? "Saving..." : "Save RFID"}
          </Button>
        </form>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-2">
          <span className="rounded-md border bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {student.rfidUid ?? "Not assigned"}
          </span>

          {student.rfidUid ? (
            <>
              <form action={clearStudentRfid} id={`clear-rfid-${student.id}`}>
                <input type="hidden" name="studentId" value={student.id} />
              </form>

              <ConfirmActionDialog
                formId={`clear-rfid-${student.id}`}
                title="Clear RFID assignment?"
                description="This will remove the current RFID UID from the student."
                actionLabel="Clear RFID"
                trigger={
                  <Button type="button" size="sm" variant="outline">
                    Clear RFID
                  </Button>
                }
              />
            </>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

export default function StudentRfidTable({
  students,
}: {
  students: StudentRow[];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/80">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Student No</th>
              <th className="px-4 py-3 text-left font-medium">Student</th>
              <th className="px-4 py-3 text-left font-medium">Section</th>
              <th className="px-4 py-3 text-left font-medium">Assign / Update RFID</th>
              <th className="px-4 py-3 text-left font-medium">Current RFID</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <StudentRfidRow key={student.id} student={student} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}