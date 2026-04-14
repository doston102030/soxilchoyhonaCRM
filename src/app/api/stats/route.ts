import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getDateRange(period: string, now: Date) {
  let start: Date, end: Date;
  if (period === "day") {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  } else if (period === "week") {
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
    end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  } else if (period === "month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  } else {
    start = new Date(now.getFullYear(), 0, 1);
    end = new Date(now.getFullYear() + 1, 0, 1);
  }
  return { start, end };
}

export async function GET(req: NextRequest) {
  const period = req.nextUrl.searchParams.get("period") || "day";
  const now = new Date();
  const { start, end } = getDateRange(period, now);

  const orders = await prisma.order.findMany({
    where: { status: "paid", paidAt: { gte: start, lt: end } },
    include: {
      items: { include: { product: { include: { category: true } } } },
      table: true,
      waiter: true,
    },
  });

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const totalOrders = orders.length;
  const totalService = orders.reduce((s, o) => s + o.serviceCharge, 0);

  const productStats: Record<string, { name: string; quantity: number; revenue: number; category: string }> = {};
  const categoryStats: Record<string, { name: string; revenue: number; quantity: number }> = {};
  const tableStats: Record<string, { name: string; zone: string; orders: number; revenue: number }> = {};
  const waiterStats: Record<string, { id: number; name: string; orders: number; revenue: number; service: number }> = {};
  const shashlikStats: { productName: string; tableName: string; quantity: number; revenue: number; time: string }[] = [];

  for (const order of orders) {
    const tKey = order.table.name;
    if (!tableStats[tKey]) tableStats[tKey] = { name: order.table.name, zone: order.table.zone, orders: 0, revenue: 0 };
    tableStats[tKey].orders += 1;
    tableStats[tKey].revenue += order.total;

    if (order.waiter) {
      const wKey = order.waiter.id.toString();
      if (!waiterStats[wKey]) waiterStats[wKey] = { id: order.waiter.id, name: order.waiter.name, orders: 0, revenue: 0, service: 0 };
      waiterStats[wKey].orders += 1;
      waiterStats[wKey].revenue += order.total;
      waiterStats[wKey].service += order.serviceCharge;
    }

    for (const item of order.items) {
      const key = item.productId.toString();
      if (!productStats[key]) productStats[key] = { name: item.name, quantity: 0, revenue: 0, category: item.product.category.name };
      productStats[key].quantity += item.quantity;
      productStats[key].revenue += item.total;

      const catKey = item.product.category.name;
      if (!categoryStats[catKey]) categoryStats[catKey] = { name: catKey, revenue: 0, quantity: 0 };
      categoryStats[catKey].revenue += item.total;
      categoryStats[catKey].quantity += item.quantity;

      if (item.product.category.name === "Shashliklar") {
        shashlikStats.push({
          productName: item.name,
          tableName: order.table.name,
          quantity: item.quantity,
          revenue: item.total,
          time: order.paidAt?.toISOString() ?? order.createdAt.toISOString(),
        });
      }
    }
  }

  const chartData: { label: string; value: number }[] = [];
  const monthNames = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];
  const dayNames = ["Yak", "Du", "Se", "Cho", "Pay", "Ju", "Sha"];

  if (period === "day") {
    const hours: Record<number, number> = {};
    for (const o of orders) { const h = (o.paidAt ?? o.createdAt).getHours(); hours[h] = (hours[h] || 0) + o.total; }
    for (let h = 7; h < 24; h++) chartData.push({ label: `${h}:00`, value: hours[h] || 0 });
  } else if (period === "week") {
    const days: Record<number, number> = {};
    for (const o of orders) { const d = (o.paidAt ?? o.createdAt).getDay(); days[d] = (days[d] || 0) + o.total; }
    for (let d = 1; d <= 7; d++) { const idx = d === 7 ? 0 : d; chartData.push({ label: dayNames[idx], value: days[idx] || 0 }); }
  } else if (period === "month") {
    const days: Record<number, number> = {};
    for (const o of orders) { const d = (o.paidAt ?? o.createdAt).getDate(); days[d] = (days[d] || 0) + o.total; }
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) chartData.push({ label: d.toString(), value: days[d] || 0 });
  } else {
    const months: Record<number, number> = {};
    for (const o of orders) { const m = (o.paidAt ?? o.createdAt).getMonth(); months[m] = (months[m] || 0) + o.total; }
    for (let m = 0; m < 12; m++) chartData.push({ label: monthNames[m], value: months[m] || 0 });
  }

  return NextResponse.json({
    period,
    start: start.toISOString(),
    end: end.toISOString(),
    totalRevenue,
    totalOrders,
    totalService,
    products: Object.values(productStats).sort((a, b) => b.revenue - a.revenue),
    categories: Object.values(categoryStats).sort((a, b) => b.revenue - a.revenue),
    tables: Object.values(tableStats).sort((a, b) => b.revenue - a.revenue),
    waiters: Object.values(waiterStats).sort((a, b) => b.revenue - a.revenue),
    shashlik: shashlikStats,
    chartData,
  });
}
