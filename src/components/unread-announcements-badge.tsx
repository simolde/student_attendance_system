import { prisma } from "@/lib/prisma";

/**
 * Server component that returns the unread announcement count for a user.
 * Drop this next to any Bell icon in your sidebar nav.
 *
 * Usage:
 *   <UnreadAnnouncementsBadge userId={session.user.id} role={session.user.role} />
 */
export default async function UnreadAnnouncementsBadge({
  userId,
  role,
}: {
  userId: string;
  role: string;
}) {
  const targetFilter = ["ALL", role] as ("ALL" | "TEACHER" | "STUDENT" | "ADMIN")[];

  const count = await prisma.announcement.count({
    where: {
      status: "PUBLISHED",
      targets: { hasSome: targetFilter },
      reads: { none: { userId } },
    },
  });

  if (count === 0) return null;

  return (
    <span className="ml-auto inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}