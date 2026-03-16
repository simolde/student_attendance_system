"use client";

import { useActionState } from "react";
import { createUser, type UserFormState } from "./actions";

const initialState: UserFormState = {};

export default function UserManagementForms() {
  const [state, formAction, pending] = useActionState(
    createUser,
    initialState
  );

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Create User</h2>

      <form action={formAction} className="mt-4 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Full Name</label>
          <input
            name="name"
            type="text"
            placeholder="Full name"
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            name="email"
            type="email"
            placeholder="user@email.com"
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Password</label>
          <input
            name="password"
            type="password"
            placeholder="Enter password"
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Role</label>
          <select
            name="role"
            defaultValue="TEACHER"
            className="w-full rounded border px-3 py-2"
          >
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            <option value="ADMIN">ADMIN</option>
            <option value="TEACHER">TEACHER</option>
            <option value="STAFF">STAFF</option>
            <option value="STUDENT">STUDENT</option>
          </select>
        </div>

        {state?.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}

        {state?.success && (
          <p className="text-sm text-green-600">{state.success}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {pending ? "Saving..." : "Create User"}
        </button>
      </form>
    </div>
  );
}