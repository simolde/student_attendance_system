"use client";

import { useActionState, useEffect } from "react";
import { updateMyAccount, type AccountFormState } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const initialState: AccountFormState = {};

export default function AccountForm({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateMyAccount,
    initialState
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) toast.success(state.success);
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium">Full Name</label>
        <Input name="name" defaultValue={name} placeholder="Your full name" />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Email</label>
        <Input
          name="email"
          type="email"
          defaultValue={email}
          placeholder="Your email"
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}