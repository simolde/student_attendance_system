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
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Create Section</h2>

        <form action={sectionAction} className="mt-4 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Section Name
            </label>
            <Input
              name="name"
              type="text"
              placeholder="e.g. Grade 7 - A"
            />
          </div>

          <Button type="submit" disabled={sectionPending}>
            {sectionPending ? "Saving..." : "Add Section"}
          </Button>
        </form>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Create Student</h2>

        <form action={studentAction} className="mt-4 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Full Name</label>
            <Input
              name="name"
              type="text"
              placeholder="Student full name"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Email</label>
            <Input
              name="email"
              type="email"
              placeholder="student@email.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Student Number
            </label>
            <Input
              name="studentNo"
              type="text"
              placeholder="2026-0001"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Section</label>
            <select
              name="sectionId"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
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

          <Button type="submit" disabled={studentPending}>
            {studentPending ? "Saving..." : "Add Student"}
          </Button>
        </form>
      </div>
    </div>
  );
}