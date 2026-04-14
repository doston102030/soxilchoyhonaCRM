import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  const waiter = await prisma.waiter.update({ where: { id: Number(id) }, data });
  return NextResponse.json(waiter);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.waiter.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
