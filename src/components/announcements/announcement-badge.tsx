import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/rbac";

/**
 * Server component: renders a badge showing unread announcement count.
 * Drop this inside any server layout or sidebar that has access to auth.
 *
 * Usage:
 *   <AnnouncementBadge />
 *
 * If count is 0, renders nothing.
 * If count > 99, renders "99+".
 */
export default async function AnnouncementBadge() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { id: userId, role } = session.user;

  // Build target filter based on role
  let targetFilter: object = {};
  if (role === ROLES.TEACHER) {
    targetFilter = { target: { in: ["ALL", "TEACHER"] } };
  } else if (role === ROLES.STUDENT) {
    targetFilter = { target: { in: ["ALL", "STUDENT"] } };
  } else if (role === ROLES.STAFF) {
    targetFilter = { target: { in: ["ALL"] } };
  }
  // Admins see all targets — no filter needed

  const count = await prisma.announcement.count({
    where: {
      status: "PUBLISHED",
      ...targetFilter,
      reads: {
        none: { userId },
      },
    },
  });

  if (count === 0) return null;

  const label = count > 99 ? "99+" : String(count);

  return (
    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
      {label}
    </span>
  );
}
