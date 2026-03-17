"use client";

import { useTransition } from "react";
import {
  toggleUserActive,
  updateUserRole,
  resetUserPassword,
} from "./actions";

type UserRow = {
  id: string;
  role: string;
  isActive: boolean;
};

export default function UserTableActions({
  user,
}: {
  user: UserRow;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      <form
        action={(formData) => {
          startTransition(async () => {
            await updateUserRole(formData);
          });
        }}
        className="flex gap-2"
      >
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
          disabled={isPending}
          className="rounded border px-3 py-1 text-sm"
        >
          Save Role
        </button>
      </form>

      <form
        action={(formData) => {
          startTransition(async () => {
            await toggleUserActive(formData);
          });
        }}
      >
        <input type="hidden" name="userId" value={user.id} />
        <button
          type="submit"
          disabled={isPending}
          className="rounded border px-3 py-1 text-sm"
        >
          {user.isActive ? "Deactivate" : "Activate"}
        </button>
      </form>

      <form
        action={(formData) => {
          startTransition(async () => {
            await resetUserPassword(formData);
          });
        }}
        className="flex gap-2"
      >
        <input type="hidden" name="userId" value={user.id} />
        <input
          type="password"
          name="password"
          placeholder="New password"
          className="rounded border px-2 py-1 text-sm"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded border px-3 py-1 text-sm"
        >
          Reset Password
        </button>
      </form>
    </div>
  );
}