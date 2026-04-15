import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding...");

  // === STOLLAR / XONALAR ===
  const tables: { name: string; zone: string; sortOrder: number }[] = [];

  // Kapa 1-5
  for (let i = 1; i <= 5; i++) {
    tables.push({ name: `Kapa ${i}`, zone: "Kapa", sortOrder: i });
  }
  // Sori 6-11
  for (let i = 6; i <= 11; i++) {
    tables.push({ name: `Sori ${i}`, zone: "Sori", sortOrder: i });
  }
  // O'rta sori
  tables.push({ name: "O'rta sori", zone: "O'rta sori", sortOrder: 1 });

  // Pastki stol-stul 1-5
  for (let i = 1; i <= 5; i++) {
    tables.push({ name: `Past stol ${i}`, zone: "Past stol", sortOrder: i });
  }
  // Katta xona tepa 1, 3, 4
  for (const i of [1, 3, 4]) {
    tables.push({ name: `Katta xona tepa ${i}`, zone: "Katta xona tepa", sortOrder: i });
  }
  // Katta xona tepa stol-stul 1-5
  for (let i = 1; i <= 5; i++) {
    tables.push({
      name: `Katta xona stol ${i}`,
      zone: "Katta xona stol",
      sortOrder: i,
    });
  }

  for (const t of tables) {
    await prisma.table.upsert({
      where: { name: t.name },
      update: {},
      create: t,
    });
  }

  // === KATEGORIYALAR ===
  const categories = [
    { name: "Asosiy", icon: "🍞", sortOrder: 1 },
    { name: "Salatlar", icon: "🥗", sortOrder: 2 },
    { name: "Qo'shimchalar", icon: "🌶", sortOrder: 3 },
    { name: "Ichimliklar", icon: "🥤", sortOrder: 4 },
    { name: "Shashliklar", icon: "🍢", sortOrder: 5 },
    { name: "Maxsus taomlar", icon: "🍗", sortOrder: 6 },
  ];

  const catMap: Record<string, number> = {};
  for (const c of categories) {
    const cat = await prisma.category.upsert({
      where: { name: c.name },
      update: { icon: c.icon, sortOrder: c.sortOrder },
      create: c,
    });
    catMap[c.name] = cat.id;
  }

  // === MAHSULOTLAR ===
  const products = [
    // Asosiy
    { name: "Non", price: 4000, cat: "Asosiy", emoji: "🍞" },
    { name: "Choy", price: 3000, cat: "Asosiy", emoji: "🫖" },
    { name: "Salfetka", price: 5000, cat: "Asosiy", emoji: "🧻" },
    { name: "Nam salfetka", price: 4000, cat: "Asosiy", emoji: "💧" },
    // Salatlar
    { name: "Kichik salat", price: 10000, cat: "Salatlar", emoji: "🥗" },
    { name: "Katta salat", price: 20000, cat: "Salatlar", emoji: "🥙" },
    // Qo'shimchalar
    { name: "Kalampir", price: 2000, cat: "Qo'shimchalar", emoji: "🌶️" },
    // Ichimliklar
    { name: "Pepsi 1L", price: 15000, cat: "Ichimliklar", emoji: "🥤" },
    { name: "Pepsi 1.5L", price: 18000, cat: "Ichimliklar", emoji: "🥤" },
    { name: "Coca-Cola 1.5L", price: 18000, cat: "Ichimliklar", emoji: "🍾" },
    { name: "Coca-Cola 2L", price: 20000, cat: "Ichimliklar", emoji: "🍾" },
    { name: "Fanta 1.5L", price: 18000, cat: "Ichimliklar", emoji: "🧃" },
    { name: "Sok (Viko)", price: 22000, cat: "Ichimliklar", emoji: "🍹" },
    { name: "Silver suv", price: 5000, cat: "Ichimliklar", emoji: "💧" },
    { name: "Garden sharbat", price: 20000, cat: "Ichimliklar", emoji: "🍓" },
    // Shashliklar
    { name: "Qiyma shashlik", price: 20000, cat: "Shashliklar", emoji: "🍢" },
    { name: "Go'sht shashlik", price: 24000, cat: "Shashliklar", emoji: "🥩" },
    { name: "Qo'y go'shti shashlik", price: 30000, cat: "Shashliklar", emoji: "🍖" },
    // Maxsus (kg bo'yicha)
    { name: "Kanotcha", price: 75000, cat: "Maxsus taomlar", emoji: "🍗", isWeighted: true, unit: "kg" },
    { name: "O'rdak go'shti", price: 140000, cat: "Maxsus taomlar", emoji: "🦆", isWeighted: true, unit: "kg" },
  ];

  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    const data = {
      name: p.name,
      price: p.price,
      categoryId: catMap[p.cat],
      emoji: (p as any).emoji ?? "🍽",
      isWeighted: (p as any).isWeighted ?? false,
      unit: (p as any).unit ?? "dona",
    };
    if (existing) {
      await prisma.product.update({ where: { id: existing.id }, data });
    } else {
      await prisma.product.create({ data });
    }
  }

  console.log("✅ Seed tugadi!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
