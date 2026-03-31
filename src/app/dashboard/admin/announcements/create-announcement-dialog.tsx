"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import AnnouncementForm from "./announcement-form";
import { createAnnouncement } from "./actions";

export default function CreateAnnouncementDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-10 gap-2 rounded-xl px-4">
          <Plus className="h-4 w-4" />
          New Announcement
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create Announcement</DialogTitle>
          <DialogDescription>
            Fill out the form below to create a new announcement.
          </DialogDescription>
        </DialogHeader>

        <AnnouncementForm
          formAction={createAnnouncement}
          onSuccess={() => setOpen(false)}
          submitLabel="Publish Announcement"
        />
      </DialogContent>
    </Dialog>
  );
}
