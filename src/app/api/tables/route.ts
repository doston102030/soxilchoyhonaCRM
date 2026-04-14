import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tables = await prisma.table.findMany({
    orderBy: [{ zone: "asc" }, { sortOrder: "asc" }],
    include: {
      orders: {
        where: { status: "open" },
        include: { items: true },
      },
    },
  });
  return NextResponse.json(tables);
}
