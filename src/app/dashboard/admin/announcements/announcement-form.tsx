"use client";

import { useActionState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { AnnouncementFormState } from "./actions";

type Props = {
  formAction: (
    prevState: AnnouncementFormState,
    formData: FormData
  ) => Promise<AnnouncementFormState>;
  initialData?: {
    id: string;
    title: string;
    content: string;
    targets: ("ALL" | "ADMIN" | "TEACHER" | "STUDENT")[];
    isPinned: boolean;
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  } | null;
  onSuccess?: () => void;
  submitLabel?: string;
};

const initialState: AnnouncementFormState = {};

export default function AnnouncementForm({
  formAction,
  initialData,
  onSuccess,
  submitLabel = "Save Announcement",
}: Props) {
  const [state, action, pending] = useActionState(formAction, initialState);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) {
      toast.success(state.success);
      onSuccess?.();
    }
  }, [state, onSuccess]);

  return (
    <form action={action} className="space-y-5">
      {initialData?.id && (
        <input type="hidden" name="id" value={initialData.id} />
      )}

      {/* Title */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">
          Title <span className="text-rose-500">*</span>
        </label>
        <Input
          name="title"
          placeholder="Announcement title"
          defaultValue={initialData?.title ?? ""}
          className="h-11"
          maxLength={200}
          required
        />
      </div>

      {/* Content */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">
          Content <span className="text-rose-500">*</span>
        </label>
        <Textarea
          name="content"
          placeholder="Write the announcement content here..."
          defaultValue={initialData?.content ?? ""}
          className="min-h-32 resize-y"
          maxLength={5000}
          required
        />
      </div>

      {/* Target + Status row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Target Audience
          </label>
          <select
            name="target"
            defaultValue={initialData?.targets ?? "ALL"}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-blue-300"
          >
            <option value="ALL">All Users</option>
            <option value="ADMIN">Admin Only</option>
            <option value="TEACHER">Teachers</option>
            <option value="STUDENT">Students</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Status</label>
          <select
            name="status"
            defaultValue={initialData?.status ?? "PUBLISHED"}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-blue-300"
          >
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Pin toggle */}
      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
        <input
          type="checkbox"
          name="isPinned"
          defaultChecked={initialData?.isPinned ?? false}
          className="h-4 w-4 rounded border-slate-300"
        />
        Pin this announcement (shows at top of list)
      </label>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="submit" disabled={pending} className="min-w-36">
          {pending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
