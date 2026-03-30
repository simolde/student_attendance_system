"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import AnnouncementForm from "../../../../components/announcements/announcement-form";

type AnnouncementData = {
  id: string;
  title: string;
  content: string;
  target: string;
  status: string;
  isPinned: boolean;
};

export default function EditAnnouncementDialog({
  announcement,
}: {
  announcement: AnnouncementData;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 rounded-lg">
          <Pencil className="mr-1.5 h-3.5 w-3.5" />
          Edit
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Announcement</DialogTitle>
          <DialogDescription>
            Update the announcement details below.
          </DialogDescription>
        </DialogHeader>

        <AnnouncementForm
          mode="edit"
          announcement={announcement}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
