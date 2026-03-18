"use client";

import { useActionState } from "react";
import { updateMyAccount, type AccountFormState } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium">Full Name</label>
        <Input name="name" defaultValue={name} placeholder="Your full name" />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Email</label>
        <Input name="email" type="email" defaultValue={email} placeholder="Your email" />
      </div>

      {state?.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}

      {state?.success ? (
        <p className="text-sm text-green-600">{state.success}</p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}