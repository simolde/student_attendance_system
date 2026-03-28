"use client";

import { useActionState } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { saveAttendance, type AttendanceFormState } from "./actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Search,
  Users,
} from "lucide-react";

const initialState: AttendanceFormState = {};

type SectionOption = {
  id: string;
  name: string;
};

type StudentRow = {
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
  activeSchoolYearName,
}: {
  sections: SectionOption[];
  selectedSectionId: string;
  selectedDate: string;
  students: StudentRow[];
  activeSchoolYearName: string | null;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(saveAttendance, initialState);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) toast.success(state.success);
  }, [state]);

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return students;

    return students.filter((student) => {
      const name = student.user.name?.toLowerCase() ?? "";
      const email = student.user.email.toLowerCase();
      const studentNo = student.studentNo.toLowerCase();

      return (
        studentNo.includes(term) ||
        name.includes(term) ||
        email.includes(term)
      );
    });
  }, [search, students]);

  return (
    <div className="space-y-6">
      <form method="get" className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <label htmlFor="sectionId" className="text-sm font-medium text-slate-700">
            Section
          </label>
          <select
            id="sectionId"
            name="sectionId"
            defaultValue={selectedSectionId}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-blue-300"
          >
            <option value="">Select section</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="date" className="text-sm font-medium text-slate-700">
            Date
          </label>
          <input
            id="date"
            type="date"
            name="date"
            defaultValue={selectedDate}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-blue-300"
          />
        </div>

        <div className="flex items-end">
          <Button type="submit" className="h-11 w-full rounded-xl">
            Load Students
          </Button>
        </div>
      </form>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="portal-card-soft p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
            School Year
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            {activeSchoolYearName ?? "-"}
          </div>
        </div>

        <div className="portal-card-soft p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
            Selected Date
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            {selectedDate}
          </div>
        </div>

        <div className="portal-card-soft p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
            <Users className="h-3.5 w-3.5" />
            Loaded Students
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            {students.length}
          </div>
        </div>
      </div>

      {students.length > 0 ? (
        <>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student no, name, or email"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm shadow-sm outline-none transition focus:border-blue-300"
            />
          </div>

          <form action={formAction} className="space-y-5">
            <input type="hidden" name="sectionId" value={selectedSectionId} />
            <input type="hidden" name="date" value={selectedDate} />

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50/80">
                      <th className="px-4 py-3 text-left font-medium text-slate-700">
                        Student No
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">
                        Student
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">
                        Remarks
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-10 text-center text-slate-500"
                        >
                          No students matched your search.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student) => (
                        <tr key={student.id} className="border-t border-slate-100">
                          <td className="px-4 py-4 font-medium text-slate-900">
                            {student.studentNo}
                          </td>
                          <td className="px-4 py-4 text-slate-700">
                            {student.user.name ?? "-"}
                          </td>
                          <td className="px-4 py-4 text-slate-600">
                            {student.user.email}
                          </td>
                          <td className="px-4 py-4">
                            <select
                              name={`status_${student.id}`}
                              defaultValue="PRESENT"
                              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300"
                            >
                              <option value="PRESENT">Present</option>
                              <option value="LATE">Late</option>
                              <option value="ABSENT">Absent</option>
                              <option value="EXCUSED">Excused</option>
                            </select>
                          </td>
                          <td className="px-4 py-4">
                            <input
                              type="text"
                              name={`remarks_${student.id}`}
                              placeholder="Optional remarks"
                              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300"
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-600">
                {filteredStudents.length} student
                {filteredStudents.length === 1 ? "" : "s"} ready to save
              </div>

              <Button type="submit" disabled={pending} className="h-11 rounded-xl px-6">
                {pending ? "Saving Attendance..." : "Save Attendance"}
              </Button>
            </div>
          </form>
        </>
      ) : (
        <div className="portal-card-soft flex min-h-55 items-center justify-center p-8 text-center">
          <div className="space-y-2">
            <p className="text-base font-semibold text-slate-900">
              No students loaded yet
            </p>
            <p className="text-sm text-slate-600">
              Select a section and date, then click <span className="font-medium">Load Students</span>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}