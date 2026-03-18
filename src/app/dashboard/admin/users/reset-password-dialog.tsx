"use client";

import { useActionState, useState } from "react";
import {
  resetUserPassword,
  type UserFormState,
} from "./actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import PasswordField from "@/components/password-field";

const initialState: UserFormState = {};

export default function ResetPasswordDialog({
  userId,
  userEmail,
}: {
  userId: string;
  userEmail: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    resetUserPassword,
    initialState
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          Reset Password
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Set a new password for {userEmail}.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="userId" value={userId} />

          <PasswordField
            name="password"
            label="New Password"
            placeholder="Enter new password"
          />

          {state?.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}

          {state?.success ? (
            <p className="text-sm text-green-600">{state.success}</p>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Reset Password"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}