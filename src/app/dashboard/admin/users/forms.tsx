"use client";

import { useActionState } from "react";
import { createUser, type UserFormState } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initialState: UserFormState = {};

export default function UserManagementForms() {
  const [state, formAction, pending] = useActionState(
    createUser,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium">Full Name</label>
        <Input name="name" type="text" placeholder="Full name" />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Email</label>
        <Input name="email" type="email" placeholder="user@email.com" />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Password</label>
        <Input name="password" type="password" placeholder="Enter password" />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Role</label>
        <select
          name="role"
          defaultValue="TEACHER"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
          <option value="ADMIN">ADMIN</option>
          <option value="TEACHER">TEACHER</option>
          <option value="STAFF">STAFF</option>
          <option value="STUDENT">STUDENT</option>
        </select>
      </div>

      {state?.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}

      {state?.success ? (
        <p className="text-sm text-green-600">{state.success}</p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Create User"}
      </Button>
    </form>
  );
}