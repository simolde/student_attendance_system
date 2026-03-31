"use client";

import { Pin, PinOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ConfirmActionDialog from "@/components/confirm-action-dialog";
import { deleteAnnouncement, toggleAnnouncementPin } from "./actions";
import EditAnnouncementDialog from "./edit-announcement-dialog";

// Match the backend model
export type AnnouncementRow = {
  id: string;
  title: string;
  content: string;
  targets: ("ALL" | "ADMIN" | "TEACHER" | "STUDENT")[];
  isPinned: boolean;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
};

export default function AnnouncementRowActions({
  announcement,
}: {
  announcement: AnnouncementRow;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {/* Edit */}
      <EditAnnouncementDialog announcement={announcement} />

      {/* Pin / Unpin */}
      <form action={toggleAnnouncementPin}>
        <input type="hidden" name="id" value={announcement.id} />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          title={announcement.isPinned ? "Unpin" : "Pin"}
          className="h-8 gap-1.5 rounded-lg px-2.5 text-xs"
        >
          {announcement.isPinned ? (
            <PinOff className="h-3.5 w-3.5" />
          ) : (
            <Pin className="h-3.5 w-3.5" />
          )}
          {announcement.isPinned ? "Unpin" : "Pin"}
        </Button>
      </form>

      {/* Delete */}
      <form action={deleteAnnouncement} id={`delete-announcement-${announcement.id}`}>
        <input type="hidden" name="id" value={announcement.id} />
      </form>

      <ConfirmActionDialog
        formId={`delete-announcement-${announcement.id}`}
        title="Delete announcement?"
        description={`This will permanently delete "${announcement.title}". This action cannot be undone.`}
        actionLabel="Delete"
        trigger={
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="h-8 gap-1.5 rounded-lg px-2.5 text-xs"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        }
      />
    </div>
  );
}