"use client";

import { useActionState, useEffect } from "react";
import { createAnnouncement, type AnnouncementFormState } from "./actions";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const initialState: AnnouncementFormState = {};

export function AnnouncementForm() {
  const [state, formAction, pending] = useActionState(
    createAnnouncement,
    initialState
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) toast.success(state.success);
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      <Input name="title" placeholder="Title" />
      <Textarea name="content" placeholder="Content" />

      <select name="role" className="w-full border p-2 rounded">
        <option value="ALL">All</option>
        <option value="TEACHER">Teacher</option>
        <option value="STUDENT">Student</option>
      </select>

      <Button type="submit" disabled={pending}>
        {pending ? "Publishing..." : "Publish"}
      </Button>
    </form>
  );
}