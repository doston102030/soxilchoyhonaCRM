import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, icon } = body;
  if (!name) return NextResponse.json({ error: "Nom kerak" }, { status: 400 });
  const last = await prisma.category.findFirst({ orderBy: { sortOrder: "desc" } });
  const category = await prisma.category.create({
    data: { name, icon: icon || "📦", sortOrder: (last?.sortOrder ?? 0) + 1 },
  });
  return NextResponse.json(category);
}
