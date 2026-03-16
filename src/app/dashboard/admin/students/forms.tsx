"use client";

import { useActionState } from "react";
import { createSection, createStudent, type FormState } from "./actions";

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

  return (
    <div className="mt-8 grid gap-6 md:grid-cols-2">
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Create Section</h2>

        <form action={sectionAction} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Section Name
            </label>
            <input
              name="name"
              type="text"
              placeholder="e.g. Grade 7 - A"
              className="w-full rounded border px-3 py-2"
            />
          </div>

          {sectionState?.error && (
            <p className="text-sm text-red-600">{sectionState.error}</p>
          )}

          {sectionState?.success && (
            <p className="text-sm text-green-600">{sectionState.success}</p>
          )}

          <button
            type="submit"
            disabled={sectionPending}
            className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {sectionPending ? "Saving..." : "Add Section"}
          </button>
        </form>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Create Student</h2>

        <form action={studentAction} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Full Name</label>
            <input
              name="name"
              type="text"
              placeholder="Student full name"
              className="w-full rounded border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              name="email"
              type="email"
              placeholder="student@email.com"
              className="w-full rounded border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Student Number
            </label>
            <input
              name="studentNo"
              type="text"
              placeholder="2026-0001"
              className="w-full rounded border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Section</label>
            <select
              name="sectionId"
              className="w-full rounded border px-3 py-2"
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

          {studentState?.error && (
            <p className="text-sm text-red-600">{studentState.error}</p>
          )}

          {studentState?.success && (
            <p className="text-sm text-green-600">{studentState.success}</p>
          )}

          <button
            type="submit"
            disabled={studentPending}
            className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {studentPending ? "Saving..." : "Add Student"}
          </button>
        </form>
      </div>
    </div>
  );
}