"use client";

import { useActionState, useEffect } from "react";
import { createSection, createStudent, type FormState } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const initialState: FormState = {};

export default function StudentManagementForms({
  sections,
}: {
  sections: { id: string; name: string }[];
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
            Add a new class or section for student grouping.
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
              placeholder="e.g. Grade 7 - A"
              className="h-11"
            />
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
            Add a new student and assign them to a section.
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
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-800">Quick note</p>
            <p className="mt-1 text-xs text-slate-600">
              Make sure the student email and student number are unique before
              saving.
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