"use client";

import { Button } from "@/components/ui/button";
import { Pin, PinOff } from "lucide-react";
import { toggleAnnouncementPin } from "./actions";
import EditAnnouncementDialog from "./edit-dialog";
import DeleteAnnouncementDialog from "./delete-dialog";

type AnnouncementData = {
  id: string;
  title: string;
  content: string;
  target: string;
  status: string;
  isPinned: boolean;
};

export default function AnnouncementRowActions({
  announcement,
}: {
  announcement: AnnouncementData;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Pin / Unpin */}
      <form action={toggleAnnouncementPin}>
        <input type="hidden" name="announcementId" value={announcement.id} />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="h-8 rounded-lg"
          title={announcement.isPinned ? "Unpin" : "Pin"}
        >
          {announcement.isPinned ? (
            <PinOff className="mr-1.5 h-3.5 w-3.5" />
          ) : (
            <Pin className="mr-1.5 h-3.5 w-3.5" />
          )}
          {announcement.isPinned ? "Unpin" : "Pin"}
        </Button>
      </form>

      {/* Edit */}
      <EditAnnouncementDialog announcement={announcement} />

      {/* Delete */}
      <DeleteAnnouncementDialog
        id={announcement.id}
        title={announcement.title}
      />
    </div>
  );
}
