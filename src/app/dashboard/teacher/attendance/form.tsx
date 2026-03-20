"use client";

import { useActionState, useEffect } from "react";
import { saveAttendance, type AttendanceFormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const initialState: AttendanceFormState = {};

type Section = {
  id: string;
  name: string;
};

type Student = {
  id: string;
  studentNo: string;
  user: {
    name: string | null;
    email: string;
  };
};

export default function AttendanceForm({
  sections,
  selectedSectionId,
  selectedDate,
  students,
}: {
  sections: Section[];
  selectedSectionId: string;
  selectedDate: string;
  students: Student[];
}) {
  const [state, formAction, pending] = useActionState(
    saveAttendance,
    initialState
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) toast.success(state.success);
  }, [state]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <form method="GET" className="grid gap-4 lg:grid-cols-[1fr_220px_auto]">
          <div>
            <label className="mb-2 block text-sm font-medium">Section</label>
            <select
              name="sectionId"
              defaultValue={selectedSectionId}
              className="h-11 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="">Select section</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Date</label>
            <Input type="date" name="date" defaultValue={selectedDate} className="h-11" />
          </div>

          <div className="flex items-end">
            <Button type="submit" className="w-full lg:w-auto">
              Load Students
            </Button>
          </div>
        </form>
      </div>

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="sectionId" value={selectedSectionId} />
        <input type="hidden" name="date" value={selectedDate} />

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead>Student No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {!selectedSectionId ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-sm text-slate-500">
                    Please select a section and click Load Students.
                  </TableCell>
                </TableRow>
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-sm text-slate-500">
                    No students in this section.
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium text-slate-900">
                      {student.studentNo}
                    </TableCell>
                    <TableCell>{student.user.name ?? student.user.email}</TableCell>
                    <TableCell>
                      <select
                        name={`status_${student.id}`}
                        defaultValue="PRESENT"
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
                        name={`remarks_${student.id}`}
                        type="text"
                        placeholder="Optional remarks"
                        className="h-10"
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-800">Ready to save?</p>
            <p className="text-xs text-slate-600">
              Review statuses before saving attendance for this section and date.
            </p>
          </div>

          <Button
            type="submit"
            disabled={pending || !selectedSectionId || students.length === 0}
            className="min-w-40"
          >
            {pending ? "Saving..." : "Save Attendance"}
          </Button>
        </div>
      </form>
    </div>
  );
}