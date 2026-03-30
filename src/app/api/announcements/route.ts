import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");

  const data = await prisma.announcement.findMany({
    where: {
      OR: [
        { role: "ALL" },
        ...(role ? [{ role }] : []),
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(data);
}

// POST
export async function POST(req: Request) {
  const body = await req.json();

  const data = await prisma.announcement.create({
    data: {
      title: body.title,
      content: body.content,
      role: body.role || "ALL",
    },
  });

  return NextResponse.json(data);
}

// UPDATE (edit announcement)
export async function PUT(req: Request) {
  const body = await req.json();
  const { id, title, content, role } = body;

  if (!id) {
    return Response.json({ error: "ID is required" }, { status: 400 });
  }

  const updated = await prisma.announcement.update({
    where: { id },
    data: { title, content, role },
  });

  return Response.json(updated);
}

// DELETE (remove announcement)
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