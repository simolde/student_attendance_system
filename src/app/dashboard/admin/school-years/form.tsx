"use client";

import { useActionState, useEffect } from "react";
import { createSchoolYear, type SchoolYearFormState } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const initialState: SchoolYearFormState = {};

export default function SchoolYearForm() {
  const [state, formAction, pending] = useActionState(
    createSchoolYear,
    initialState
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) toast.success(state.success);
  }, [state]);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            School Year Name
          </label>
          <Input
            name="name"
            placeholder="e.g. 2026-2027"
            className="h-11"
          />
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" name="isActive" />
            Set as active school year
          </label>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Start Date
          </label>
          <Input name="startDate" type="date" className="h-11" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            End Date
          </label>
          <Input name="endDate" type="date" className="h-11" />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-800">Quick note</p>
        <p className="mt-1 text-xs text-slate-600">
          Only one school year should be active at a time. Student enrollments
          and attendance imports should point to the active school year.
        </p>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending} className="min-w-36">
          {pending ? "Creating..." : "Create School Year"}
        </Button>
      </div>
    </form>
  );
}