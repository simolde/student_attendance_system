"use client";

import { useActionState } from "react";
import {
  toggleUserActive,
  updateUserRole,
  resetUserPassword,
  type UserFormState,
} from "./actions";

type UserRow = {
  id: string;
  role: string;
  isActive: boolean;
};

const initialState: UserFormState = {};

export default function UserTableActions({
  user,
}: {
  user: UserRow;
}) {
  const [roleState, roleAction, rolePending] = useActionState(
    updateUserRole,
    initialState
  );

  const [activeState, activeAction, activePending] = useActionState(
    toggleUserActive,
    initialState
  );

  const [passwordState, passwordAction, passwordPending] = useActionState(
    resetUserPassword,
    initialState
  );

  return (
    <div className="flex flex-col gap-3">
      <form action={roleAction} className="flex gap-2">
        <input type="hidden" name="userId" value={user.id} />
        <select
          name="role"
          defaultValue={user.role}
          className="rounded border px-2 py-1 text-sm"
        >
          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
          <option value="ADMIN">ADMIN</option>
          <option value="TEACHER">TEACHER</option>
          <option value="STAFF">STAFF</option>
          <option value="STUDENT">STUDENT</option>
        </select>

        <button
          type="submit"
          disabled={rolePending}
          className="rounded border px-3 py-1 text-sm"
        >
          {rolePending ? "Saving..." : "Save Role"}
        </button>
      </form>

      {roleState?.error ? (
        <p className="text-xs text-destructive">{roleState.error}</p>
      ) : null}
      {roleState?.success ? (
        <p className="text-xs text-green-600">{roleState.success}</p>
      ) : null}

      <form action={activeAction}>
        <input type="hidden" name="userId" value={user.id} />
        <button
          type="submit"
          disabled={activePending}
          className="rounded border px-3 py-1 text-sm"
        >
          {activePending
            ? "Saving..."
            : user.isActive
            ? "Deactivate"
            : "Activate"}
        </button>
      </form>

      {activeState?.error ? (
        <p className="text-xs text-destructive">{activeState.error}</p>
      ) : null}
      {activeState?.success ? (
        <p className="text-xs text-green-600">{activeState.success}</p>
      ) : null}

      <form action={passwordAction} className="flex gap-2">
        <input type="hidden" name="userId" value={user.id} />
        <input
          type="password"
          name="password"
          placeholder="New password"
          className="rounded border px-2 py-1 text-sm"
        />
        <button
          type="submit"
          disabled={passwordPending}
          className="rounded border px-3 py-1 text-sm"
        >
          {passwordPending ? "Saving..." : "Reset Password"}
        </button>
      </form>

      {passwordState?.error ? (
        <p className="text-xs text-destructive">{passwordState.error}</p>
      ) : null}
      {passwordState?.success ? (
        <p className="text-xs text-green-600">{passwordState.success}</p>
      ) : null}
    </div>
  );
}