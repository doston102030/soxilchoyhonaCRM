# 🍵 Sohil Choyxona — Hisob-kitob tizimi

Choyxona uchun to'liq POS tizimi. Ofitsiantlar buyurtma qabul qiladi, admin
panel orqali narxlar, mahsulotlar va statistika boshqariladi.

## 🎯 Imkoniyatlar

- **19 ta stol/xona** — Kapa, Sori, O'rta sori, Past stol, Katta xona
- **To'liq menyu** — 20+ mahsulot, 6 kategoriya (seed bilan tayyor)
- **Kg bo'yicha sotish** — Kanotcha va o'rdak go'shti uchun (1.2 kg, 0.5 kg, va h.k.)
- **1% xizmat haqi** — avtomatik qo'shiladi
- **Chek chop etish** — brauzer print (termal printer keyin qo'shiladi)
- **Admin panel:**
  - 📊 Kunlik / Oylik / Yillik hisobot (grafiklar bilan)
  - 📦 Mahsulot qo'shish / tahrirlash / narx o'zgartirish
  - 🔥 Shashlik statistikasi — qaysi turi, qaysi stolga, nechta
  - 📜 Buyurtmalar tarixi
- **Responsive** — telefon va kompyuterdan ishlaydi
- **Offline** — SQLite lokal baza, internet kerak emas

## 🛠 Texnologiyalar

- **Next.js 15** (App Router) + **TypeScript**
- **Prisma** + **SQLite**
- **Tailwind CSS** + **shadcn/ui**
- **Recharts** — grafiklar
- **Sonner** — toast xabarlar

## 🚀 Ishga tushirish

### 1. Kutubxonalarni o'rnatish
```bash
npm install
```

### 2. Ma'lumotlar bazasini yaratish
```bash
npm run db:push
```

### 3. Boshlang'ich ma'lumotlarni yuklash (stollar + menyu)
```bash
npm run db:seed
```

### 4. Dasturni ishga tushirish
```bash
npm run dev
```

Brauzerda oching: **http://localhost:3000**

### Prodakshn uchun
```bash
npm run build
npm start
```

## 📱 Ishlatish

### Ofitsiant uchun
1. Bosh sahifa — stollar ro'yxati. Bo'sh stol — oddiy rang, band stol — to'q sariq.
2. Stolni bosing → menyudan mahsulot tanlang → "Buyurtma berish"
3. Mijoz ketganda → "To'lov qilish" tugmasi → chek chop etiladi

### Admin uchun
1. Yuqori o'ng burchakdan **Admin** tugmasini bosing
2. 4 ta tab:
   - **Hisobot** — tushum, buyurtmalar soni, grafiklar
   - **Menyu** — narxlarni o'zgartirish, yangi mahsulot qo'shish
   - **Shashlik** — batafsil shashlik statistikasi
   - **Tarix** — barcha to'lov qilingan buyurtmalar

## 🏗 Loyiha tuzilishi

```
sohil-choyxona/
├── prisma/
│   ├── schema.prisma       # Ma'lumotlar bazasi modeli
│   ├── seed.ts             # Boshlang'ich ma'lumotlar
│   └── sohil.db            # SQLite fayl (avtomatik yaratiladi)
├── src/
│   ├── app/
│   │   ├── layout.tsx      # Root layout (fontlar)
│   │   ├── page.tsx        # Bosh sahifa — stollar
│   │   ├── order/[tableId]/page.tsx   # Buyurtma sahifasi
│   │   ├── admin/page.tsx  # Admin panel
│   │   ├── globals.css
│   │   └── api/            # API routes
│   │       ├── products/
│   │       ├── categories/
│   │       ├── tables/
│   │       ├── orders/
│   │       └── stats/
│   ├── components/ui/      # shadcn komponentlar
│   └── lib/
│       ├── prisma.ts       # Prisma client
│       └── utils.ts        # Yordamchi funksiyalar
└── package.json
```

## 📝 Muhim eslatmalar

- **Narx o'zgarsa — eski buyurtmalar to'g'ri qoladi.** Chunki har bir
  `OrderItem` buyurtma vaqtidagi narxni snapshot qilib saqlaydi.
- **Mahsulotni o'chirish — soft delete.** Mahsulot aslida o'chmaydi,
  shunchaki yashiriladi. Eski statistika to'g'ri ishlashi uchun.
- **Xizmat haqi** — `src/app/api/orders/route.ts` faylida `SERVICE_RATE` doimiysini o'zgartiring.
- **Baza fayli** — `prisma/sohil.db`. Uni zaxira nusxa qilib saqlashni unutmang!

## 🖨 Termal printerni keyin ulash

Hozircha chek brauzer orqali chop etiladi (`window.print()`).
USB termal printer kerak bo'lganda, `node-escpos` yoki `@node-escpos/core`
kutubxonasi orqali ESC/POS buyruqlarini yuborish mumkin. Bu uchun
`/api/print` endpoint qo'shish kerak.

## 📞 Yordam

Savollar bo'lsa yoki yangi funksiya kerak bo'lsa, bemalol so'rang!
