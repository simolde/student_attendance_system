import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AnnouncementTarget } from "@/../generated/prisma/client";

// All valid enum values
const validTargets = Object.values(AnnouncementTarget);

// Helper: safely parse a single target
function parseTarget(value: any): AnnouncementTarget | null {
  return validTargets.includes(value as AnnouncementTarget)
    ? (value as AnnouncementTarget)
    : null;
}

// GET: fetch announcements filtered by role/target
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roleParam = searchParams.get("role");
  const role = parseTarget(roleParam);

  const data = await prisma.announcement.findMany({
    where: {
      OR: [
        { targets: { has: "ALL" } },
        ...(role ? [{ targets: { has: role } }] : []),
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(data);
}

// POST: create a new announcement
export async function POST(req: Request) {
  const body = await req.json();

  let targets: AnnouncementTarget[] = [];

  if (Array.isArray(body.targets)) {
    targets = body.targets
      .map((t: any) => parseTarget(t))
      .filter(
        (t: AnnouncementTarget | null): t is AnnouncementTarget => t !== null
      );
  }

  // fallback to ALL if nothing valid
  if (targets.length === 0) targets = ["ALL"];
  if (targets.includes("ALL")) targets = ["ALL"]; // ALL overrides others

  const data = await prisma.announcement.create({
    data: {
      title: body.title,
      content: body.content,
      targets,
    },
  });

  return NextResponse.json(data);
}

// PUT: update an announcement
export async function PUT(req: Request) {
  const body = await req.json();
  const { id, title, content } = body;

  if (!id) {
    return Response.json({ error: "ID is required" }, { status: 400 });
  }

  let targets: AnnouncementTarget[] | undefined;

  if (Array.isArray(body.targets)) {
    targets = body.targets
      .map((t: any) => parseTarget(t))
      .filter(
        (t: AnnouncementTarget | null): t is AnnouncementTarget => t !== null
      );

    if (targets && targets.includes("ALL")) targets = ["ALL"];
  }

  const updated = await prisma.announcement.update({
    where: { id },
    data: {
      title,
      content,
      targets: targets ?? undefined,
    },
  });

  return NextResponse.json(updated);
}

// DELETE: remove an announcement
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "ID required" }, { status: 400 });
  }

  await prisma.announcement.delete({
    where: { id },
  });

  return Response.json({ success: true });
}