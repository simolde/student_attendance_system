"use client";

import { useActionState, useEffect } from "react";
import { createAttendanceRule, type AttendanceRuleFormState } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const initialState: AttendanceRuleFormState = {};

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

export default function AttendanceRuleForm({
  sections,
}: {
  sections: { id: string; name: string; gradeLevel: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    createAttendanceRule,
    initialState
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) toast.success(state.success);
  }, [state]);

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">
          Rule Name
        </label>
        <Input
          name="name"
          placeholder="e.g. Grade 7 Morning Schedule"
          className="h-11"
        />
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Grade Level Rule
          </label>
          <select
            name="gradeLevel"
            defaultValue=""
            className="h-11 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="">None</option>
            {gradeLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Section Override
          </label>
          <select
            name="sectionId"
            defaultValue=""
            className="h-11 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="">None</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.name} ({section.gradeLevel})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" name="isDefault" />
            Use as default fallback rule
          </label>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Time In Start
          </label>
          <Input name="timeInStart" type="time" className="h-11" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Late After
          </label>
          <Input name="lateAfter" type="time" className="h-11" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Time In End
          </label>
          <Input name="timeInEnd" type="time" className="h-11" />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Time Out Start
          </label>
          <Input name="timeOutStart" type="time" className="h-11" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Time Out End
          </label>
          <Input name="timeOutEnd" type="time" className="h-11" />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-800">Rule priority</p>
        <p className="mt-1 text-xs text-slate-600">
          Section rule overrides grade-level rule. Grade-level rule overrides
          default fallback rule.
        </p>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending} className="min-w-36">
          {pending ? "Creating..." : "Create Rule"}
        </Button>
      </div>
    </form>
  );
}