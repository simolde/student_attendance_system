"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  createAnnouncement,
  updateAnnouncement,
  type AnnouncementFormState,
} from "../../app/dashboard/admin/announcements/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type AnnouncementData = {
  id: string;
  title: string;
  content: string;
  target: string;
  status: string;
  isPinned: boolean;
};

const initialState: AnnouncementFormState = {};

export default function AnnouncementForm({
  mode,
  announcement,
  onSuccess,
}: {
  mode: "create" | "edit";
  announcement?: AnnouncementData;
  onSuccess?: () => void;
}) {
  const action = mode === "create" ? createAnnouncement : updateAnnouncement;
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.error && !state.fieldErrors) {
      toast.error(state.error);
    }
    if (state?.success) {
      toast.success(state.success);
      if (mode === "create") formRef.current?.reset();
      onSuccess?.();
    }
  }, [state, mode, onSuccess]);

  const fieldError = (field: string) =>
    state?.fieldErrors?.[field] ? (
      <p className="mt-1 text-xs text-red-500">{state.fieldErrors[field]}</p>
    ) : null;

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      {mode === "edit" && announcement && (
        <input type="hidden" name="announcementId" value={announcement.id} />
      )}

      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">
          Title <span className="text-red-500">*</span>
        </label>
        <Input
          name="title"
          placeholder="Announcement title..."
          defaultValue={announcement?.title ?? ""}
          className="h-11"
          aria-invalid={!!state?.fieldErrors?.title}
        />
        {fieldError("title")}
      </div>

      {/* Content */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">
          Content <span className="text-red-500">*</span>
        </label>
        <Textarea
          name="content"
          placeholder="Write the full announcement content here..."
          defaultValue={announcement?.content ?? ""}
          rows={5}
          className="resize-none"
          aria-invalid={!!state?.fieldErrors?.content}
        />
        {fieldError("content")}
      </div>

      {/* Target + Status row */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">
            Target Audience
          </label>
          <select
            name="target"
            defaultValue={announcement?.target ?? "ALL"}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-blue-300"
          >
            <option value="ALL">Everyone</option>
            <option value="TEACHER">Teachers only</option>
            <option value="STUDENT">Students only</option>
            <option value="ADMIN">Admins only</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Status</label>
          <select
            name="status"
            defaultValue={announcement?.status ?? "PUBLISHED"}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-blue-300"
          >
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Pin toggle */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <input
          type="checkbox"
          id="isPinned"
          name="isPinned"
          defaultChecked={announcement?.isPinned ?? false}
          className="h-4 w-4 rounded border-slate-300 accent-blue-600"
        />
        <label
          htmlFor="isPinned"
          className="select-none text-sm font-medium text-slate-700"
        >
          Pin this announcement (shows at the top of all announcement pages)
        </label>
      </div>

      {/* Server-level error */}
      {state?.error && !state.fieldErrors && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {state.error}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="submit" disabled={pending} className="min-w-36">
          {pending
            ? mode === "create"
              ? "Creating..."
              : "Saving..."
            : mode === "create"
              ? "Create Announcement"
              : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
