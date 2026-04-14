import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id: Number(id) },
    include: {
      items: { include: { product: true } },
      table: true,
    },
  });
  if (!order) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  if (body.action === "pay") {
    const order = await prisma.order.update({
      where: { id: Number(id) },
      data: { status: "paid", paidAt: new Date() },
      include: { items: true, table: true },
    });
    return NextResponse.json(order);
  }

  if (body.action === "cancel") {
    const order = await prisma.order.update({
      where: { id: Number(id) },
      data: { status: "cancelled" },
    });
    return NextResponse.json(order);
  }

  return NextResponse.json({ error: "Noma'lum amal" }, { status: 400 });
}
