"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { changeMyPassword, type UserFormState } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

const initialState: UserFormState = {};

function getPasswordStrength(password: string) {
  let score = 0;

  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { label: "Weak", width: "33%" };
  if (score <= 4) return { label: "Medium", width: "66%" };
  return { label: "Strong", width: "100%" };
}

export default function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(
    changeMyPassword,
    initialState
  );

  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const strength = useMemo(
    () => getPasswordStrength(newPassword),
    [newPassword]
  );

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
      return;
    }

    if (state?.success) {
      toast.success(state.success);

      const timer = setTimeout(() => {
        signOut({ callbackUrl: "/login" });
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">
          Current Password
        </label>

        <div className="relative">
          <Input
            name="currentPassword"
            type={showCurrentPassword ? "text" : "password"}
            placeholder="Enter current password"
            className="h-11 pr-11"
          />

          <button
            type="button"
            onClick={() => setShowCurrentPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
          >
            {showCurrentPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">
          New Password
        </label>

        <div className="relative">
          <Input
            name="newPassword"
            type={showNewPassword ? "text" : "password"}
            placeholder="Enter new password"
            className="h-11 pr-11"
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <button
            type="button"
            onClick={() => setShowNewPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
          >
            {showNewPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="space-y-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-slate-900 transition-all"
              style={{ width: newPassword ? strength.width : "0%" }}
            />
          </div>
          <p className="text-xs text-slate-500">
            Password strength: {newPassword ? strength.label : "-"}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">
          Confirm New Password
        </label>

        <div className="relative">
          <Input
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm new password"
            className="h-11 pr-11"
          />

          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending} className="min-w-36">
          {pending ? "Saving..." : "Change Password"}
        </Button>
      </div>
    </form>
  );
}