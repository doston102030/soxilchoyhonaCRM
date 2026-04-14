import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SERVICE_RATE = 0.01; // 1%

export async function GET(req: NextRequest) {
  const tableId = req.nextUrl.searchParams.get("tableId");
  const status = req.nextUrl.searchParams.get("status");
  const where: any = {};
  if (tableId) where.tableId = Number(tableId);
  if (status) where.status = status;

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      table: true,
      items: { include: { product: true } },
    },
    take: 100,
  });
  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { tableId, items, note, waiterId } = body as {
    tableId: number;
    items: { productId: number; quantity: number }[];
    note?: string;
    waiterId?: number;
  };

  if (!tableId || !items || items.length === 0) {
    return NextResponse.json({ error: "Ma'lumot yetarli emas" }, { status: 400 });
  }

  // Mahsulotlarni bazadan olib, snapshot narxlarni yaratamiz
  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const orderItemsData = items.map((it) => {
    const p = productMap.get(it.productId);
    if (!p) throw new Error(`Mahsulot topilmadi: ${it.productId}`);
    const total = Math.round(p.price * it.quantity);
    return {
      productId: p.id,
      name: p.name,
      price: p.price,
      quantity: it.quantity,
      total,
    };
  });

  const subtotal = orderItemsData.reduce((s, i) => s + i.total, 0);
  const serviceCharge = Math.round(subtotal * SERVICE_RATE);
  const total = subtotal + serviceCharge;

  const order = await prisma.order.create({
    data: {
      tableId,
      waiterId: waiterId ?? null,
      subtotal,
      serviceCharge,
      total,
      note,
      items: { create: orderItemsData },
    },
    include: {
      items: { include: { product: true } },
      table: true,
    },
  });

  return NextResponse.json(order);
}
