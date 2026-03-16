"use client";

import { useActionState } from "react";
import { saveAttendance, type AttendanceFormState } from "./actions";

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

  return (
    <div className="space-y-6">
      {/* Filter form */}
      <form method="GET" className="grid gap-4 rounded-lg border bg-white p-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Section</label>
          <select
            name="sectionId"
            defaultValue={selectedSectionId}
            className="w-full rounded border px-3 py-2"
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
          <label className="mb-1 block text-sm font-medium">Date</label>
          <input
            type="date"
            name="date"
            defaultValue={selectedDate}
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded bg-blue-600 px-4 py-2 text-white"
          >
            Load Students
          </button>
        </div>
      </form>

      {/* Save attendance form */}
      <form action={formAction} className="space-y-6">
        <input type="hidden" name="sectionId" value={selectedSectionId} />
        <input type="hidden" name="date" value={selectedDate} />

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state?.success && (
          <p className="text-sm text-green-600">{state.success}</p>
        )}

        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-3 py-2 text-left">Student No</th>
                <th className="border px-3 py-2 text-left">Name</th>
                <th className="border px-3 py-2 text-left">Status</th>
                <th className="border px-3 py-2 text-left">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {!selectedSectionId ? (
                <tr>
                  <td colSpan={4} className="border px-3 py-4 text-center">
                    Please select a section and click Load Students.
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={4} className="border px-3 py-4 text-center">
                    No students in this section.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id}>
                    <td className="border px-3 py-2">{student.studentNo}</td>
                    <td className="border px-3 py-2">
                      {student.user.name ?? student.user.email}
                    </td>
                    <td className="border px-3 py-2">
                      <select
                        name={`status_${student.id}`}
                        defaultValue="PRESENT"
                        className="rounded border px-2 py-1"
                      >
                        <option value="PRESENT">PRESENT</option>
                        <option value="LATE">LATE</option>
                        <option value="ABSENT">ABSENT</option>
                        <option value="EXCUSED">EXCUSED</option>
                      </select>
                    </td>
                    <td className="border px-3 py-2">
                      <input
                        name={`remarks_${student.id}`}
                        type="text"
                        placeholder="Optional remarks"
                        className="w-full rounded border px-2 py-1"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <button
          type="submit"
          disabled={pending || !selectedSectionId || students.length === 0}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save Attendance"}
        </button>
      </form>
    </div>
  );
}