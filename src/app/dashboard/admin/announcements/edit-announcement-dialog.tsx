"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import AnnouncementForm from "./announcement-form";
import { updateAnnouncement } from "./actions";

type AnnouncementRow = {
  id: string;
  title: string;
  content: string;
  target: string;
  isPinned: boolean;
  status: string;
};

export default function EditAnnouncementDialog({
  announcement,
}: {
  announcement: AnnouncementRow;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 rounded-lg px-2.5 text-xs"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Announcement</DialogTitle>
          <DialogDescription>
            Update the details of your announcement below.
          </DialogDescription>
        </DialogHeader>

        <AnnouncementForm
          formAction={updateAnnouncement}
          initialData={announcement}
          onSuccess={() => setOpen(false)}
          submitLabel="Save Changes"
        />
      </DialogContent>
    </Dialog>
  );
}
