"use client";

import { useActionState, useEffect } from "react";
import { createRfidDevice, type RfidDeviceFormState } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const initialState: RfidDeviceFormState = {};

export default function RfidDeviceForm() {
  const [state, formAction, pending] = useActionState(
    createRfidDevice,
    initialState
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) toast.success(state.success);
  }, [state]);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Device Name
          </label>
          <Input
            name="name"
            placeholder="e.g. Main Gate Scanner"
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Device Code
          </label>
          <Input
            name="deviceCode"
            placeholder="e.g. gate-1"
            className="h-11"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">
          Location
        </label>
        <Input
          name="location"
          placeholder="e.g. Front Entrance"
          className="h-11"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-800">Quick note</p>
        <p className="mt-1 text-xs text-slate-600">
          Device code should be unique. Your Python RFID client can send this
          code to identify which scanner recorded the scan.
        </p>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending} className="min-w-36">
          {pending ? "Creating..." : "Create Device"}
        </Button>
      </div>
    </form>
  );
}