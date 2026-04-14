import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const waiters = await prisma.waiter.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { orders: true } } },
  });
  return NextResponse.json(waiters);
}

export async function POST(req: NextRequest) {
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Ism kerak" }, { status: 400 });
  const waiter = await prisma.waiter.create({ data: { name: name.trim() } });
  return NextResponse.json(waiter);
}
