"use client";

import { useActionState } from "react";
import { changeMyPassword, type ChangePasswordState } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PasswordField from "@/components/password-field";

const initialState: ChangePasswordState = {};

export default function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(
    changeMyPassword,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium">Current Password</label>
        <Input name="currentPassword" type="password" placeholder="Enter current password" />
      </div>

      <PasswordField
        name="newPassword"
        label="New Password"
        placeholder="Enter new password"
      />

      <PasswordField
        name="confirmPassword"
        label="Confirm New Password"
        placeholder="Confirm new password"
      />

      {state?.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}

      {state?.success ? (
        <p className="text-sm text-green-600">{state.success}</p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Change Password"}
      </Button>
    </form>
  );
}