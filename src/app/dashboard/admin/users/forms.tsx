"use client";

import { useActionState, useEffect } from "react";
import { createUser, type UserFormState } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PasswordField from "@/components/password-field";
import { toast } from "sonner";

const initialState: UserFormState = {};

export default function UserManagementForms() {
  const [state, formAction, pending] = useActionState(
    createUser,
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
            Full Name
          </label>
          <Input
            name="name"
            type="text"
            placeholder="Enter full name"
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Email</label>
          <Input
            name="email"
            type="email"
            placeholder="Enter email address"
            className="h-11"
          />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Role</label>
          <select
            name="role"
            defaultValue="STUDENT"
            className="h-11 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            <option value="ADMIN">ADMIN</option>
            <option value="TEACHER">TEACHER</option>
            <option value="STAFF">STAFF</option>
            <option value="STUDENT">STUDENT</option>
          </select>
        </div>

        <div className="space-y-2">
          <PasswordField
            name="password"
            label="Password"
            placeholder="Enter password"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-800">Quick note</p>
        <p className="mt-1 text-xs text-slate-600">
          Use this form to create new system accounts for administrators,
          teachers, staff, or students.
        </p>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending} className="min-w-32">
          {pending ? "Creating..." : "Create User"}
        </Button>
      </div>
    </form>
  );
}