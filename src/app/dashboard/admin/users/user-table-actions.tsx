"use client";

import { useActionState, useEffect } from "react";
import {
  toggleUserActive,
  updateUserRole,
  type UserFormState,
} from "./actions";
import ResetPasswordDialog from "./reset-password-dialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import ConfirmActionDialog from "@/components/confirm-action-dialog";

type UserRow = {
  id: string;
  email: string;
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

  useEffect(() => {
    if (roleState?.error) toast.error(roleState.error);
    if (roleState?.success) toast.success(roleState.success);
  }, [roleState]);

  useEffect(() => {
    if (activeState?.error) toast.error(activeState.error);
    if (activeState?.success) toast.success(activeState.success);
  }, [activeState]);

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

        <Button type="submit" variant="outline" size="sm" disabled={rolePending}>
          {rolePending ? "Saving..." : "Save Role"}
        </Button>
      </form>

      <form action={activeAction} id={`toggle-user-${user.id}`}>
        <input type="hidden" name="userId" value={user.id} />
      </form>

      <ConfirmActionDialog
        formId={`toggle-user-${user.id}`}
        title={user.isActive ? "Deactivate user?" : "Activate user?"}
        description={
          user.isActive
            ? "This will prevent the user from logging in until reactivated."
            : "This will allow the user to log in again."
        }
        actionLabel={activePending ? "Saving..." : user.isActive ? "Deactivate" : "Activate"}
        trigger={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={activePending}
          >
            {user.isActive ? "Deactivate" : "Activate"}
          </Button>
        }
      />

      <ResetPasswordDialog userId={user.id} userEmail={user.email} />
    </div>
  );
}