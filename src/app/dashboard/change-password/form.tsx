"use client";

import { useActionState, useEffect } from "react";
import { changeMyPassword, type ChangePasswordState } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PasswordField from "@/components/password-field";
import { toast } from "sonner";

const initialState: ChangePasswordState = {};

export default function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(
    changeMyPassword,
    initialState
  );

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }

    if (state?.success) {
      toast.success(state.success);
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium">Current Password</label>
        <Input
          name="currentPassword"
          type="password"
          placeholder="Enter current password"
        />
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

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Change Password"}
      </Button>
    </form>
  );
}