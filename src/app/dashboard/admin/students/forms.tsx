"use client";

import { useActionState, useEffect } from "react";
import { createSection, createStudent, type FormState } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const initialState: FormState = {};

const gradeLevels = [
  "PRE_NURSERY",
  "NURSERY",
  "KINDER",
  "GRADE_1",
  "GRADE_2",
  "GRADE_3",
  "GRADE_4",
  "GRADE_5",
  "GRADE_6",
  "GRADE_7",
  "GRADE_8",
  "GRADE_9",
  "GRADE_10",
  "GRADE_11",
  "GRADE_12",
] as const;

const formatName = (name: string) => name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function StudentManagementForms({
  sections,
}: {
  sections: { id: string; name: string; gradeLevel: string }[];
}) {
  const [sectionState, sectionAction, sectionPending] = useActionState(
    createSection,
    initialState
  );

  const [studentState, studentAction, studentPending] = useActionState(
    createStudent,
    initialState
  );

  useEffect(() => {
    if (sectionState?.error) toast.error(sectionState.error);
    if (sectionState?.success) toast.success(sectionState.success);
  }, [sectionState]);

  useEffect(() => {
    if (studentState?.error) toast.error(studentState.error);
    if (studentState?.success) toast.success(studentState.success);
  }, [studentState]);

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-slate-900">
            Create Section
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Add a new section and assign its grade level.
          </p>
        </div>

        <form action={sectionAction} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Section Name
            </label>
            <Input
              name="name"
              type="text"
              placeholder="e.g. PICASSO"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Grade Level
            </label>
            <select
              name="gradeLevel"
              defaultValue=""
              className="h-11 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="" disabled>
                Select grade level
              </option>
              {gradeLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={sectionPending} className="min-w-32">
              {sectionPending ? "Saving..." : "Add Section"}
            </Button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-slate-900">
            Create Student
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Add a new student and enroll them in the active school year.
          </p>
        </div>

        <form action={studentAction} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Full Name
            </label>
            <Input
              name="name"
              type="text"
              placeholder="Student full name"
              className="h-11"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Email
              </label>
              <Input
                name="email"
                type="email"
                placeholder="student@email.com"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Student Number
              </label>
              <Input
                name="studentNo"
                type="text"
                placeholder="2026-0001"
                className="h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Section
            </label>
            <select
              name="sectionId"
              className="h-11 w-full rounded-md border bg-background px-3 text-sm"
              defaultValue=""
            >
              <option value="" disabled>
                Select a section
              </option>
              {sections
                .slice()
                .sort((a, b) => a.id.localeCompare(b.id))
                .map((section) => (
                  <option key={section.id} value={section.id}>
                    {formatName(section.gradeLevel)} - {section.name} 
                  </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-800">Quick note</p>
            <p className="mt-1 text-xs text-slate-600">
              This creates the user account, student profile, and enrollment for
              the active school year.
            </p>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={studentPending} className="min-w-32">
              {studentPending ? "Saving..." : "Add Student"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}