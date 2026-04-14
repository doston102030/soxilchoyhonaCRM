import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      products: {
        where: { isActive: true },
        orderBy: { id: "asc" },
      },
    },
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, price, categoryId, isWeighted, unit } = body;
  if (!name || !price || !categoryId) {
    return NextResponse.json({ error: "Ma'lumot yetarli emas" }, { status: 400 });
  }
  const product = await prisma.product.create({
    data: {
      name,
      price: Math.round(Number(price)),
      categoryId: Number(categoryId),
      isWeighted: Boolean(isWeighted),
      unit: unit || (isWeighted ? "kg" : "dona"),
    },
  });
  return NextResponse.json(product);
}
