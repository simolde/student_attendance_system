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
      <form method="GET" className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm font-medium">Section</label>
          <select
            name="sectionId"
            defaultValue={selectedSectionId}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
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
          <Input type="date" name="date" defaultValue={selectedDate} />
        </div>

        <div className="flex items-end">
          <Button type="submit" className="w-full">
            Load Students
          </Button>
        </div>
      </form>

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="sectionId" value={selectedSectionId} />
        <input type="hidden" name="date" value={selectedDate} />

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {!selectedSectionId ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Please select a section and click Load Students.
                  </TableCell>
                </TableRow>
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No students in this section.
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.studentNo}</TableCell>
                    <TableCell>
                      {student.user.name ?? student.user.email}
                    </TableCell>
                    <TableCell>
                      <select
                        name={`status_${student.id}`}
                        defaultValue="PRESENT"
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
                        name={`remarks_${student.id}`}
                        type="text"
                        placeholder="Optional remarks"
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Button
          type="submit"
          disabled={pending || !selectedSectionId || students.length === 0}
        >
          {pending ? "Saving..." : "Save Attendance"}
        </Button>
      </form>
    </div>
  );
}