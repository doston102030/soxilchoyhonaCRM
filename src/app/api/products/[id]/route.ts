import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const data: any = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.price !== undefined) data.price = Math.round(Number(body.price));
  if (body.categoryId !== undefined) data.categoryId = Number(body.categoryId);
  if (body.isWeighted !== undefined) data.isWeighted = Boolean(body.isWeighted);
  if (body.unit !== undefined) data.unit = body.unit;
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

  const product = await prisma.product.update({
    where: { id: Number(id) },
    data,
  });
  return NextResponse.json(product);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Soft delete — tarixni saqlaymiz
  await prisma.product.update({
    where: { id: Number(id) },
    data: { isActive: false },
  });
  return NextResponse.json({ success: true });
}
