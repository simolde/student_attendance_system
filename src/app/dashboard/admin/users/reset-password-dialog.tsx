"use client";

import { useActionState, useEffect, useState } from "react";
import { resetUserPassword, type UserFormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

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

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
      return;
    }

    if (state?.success) {
      toast.success(state.success);
      setOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          Reset Password
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset User Password</DialogTitle>
          <DialogDescription>
            Set a temporary password for <span className="font-medium">{userEmail}</span>.
            The user will be required to change it on next login.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-5">
          <input type="hidden" name="userId" value={userId} />

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-950">
              Important
            </p>
            <p className="mt-1 text-xs text-amber-900">
              After reset, the account will be marked to change password before
              accessing the dashboard.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Temporary Password
            </label>
            <Input
              name="password"
              type="text"
              placeholder="Enter temporary password"
              className="h-11"
              defaultValue="Starland@123"
            />
            <p className="text-xs text-slate-500">
              Choose a temporary password the user can use once before setting a new one.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={pending}>
              {pending ? "Resetting..." : "Reset Password"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}