"use client";

import { useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { markAnnouncementRead } from "@/app/dashboard/admin/announcements/actions";
import { useRouter } from "next/navigation";

export default function AnnouncementReadButton({
  announcementId,
}: {
  announcementId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      await markAnnouncementRead(announcementId);
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
    >
      <CheckCircle2 className="h-3.5 w-3.5" />
      {isPending ? "Marking…" : "Mark as read"}
    </button>
  );
}
