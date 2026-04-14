# ⚡ TEZKOR ISHGA TUSHIRISH

## 1-marta o'rnatish (faqat bir marta qilinadi)

Loyiha papkasida terminalni oching va **ketma-ket** bu 2 ta buyruqni kiriting:

```bash
npm install
```

Kutib turing (1-3 daqiqa), keyin:

```bash
npm run setup
```

Bu buyruq:
- Prisma clientni yaratadi
- SQLite bazani ochadi
- 19 ta stol va 20 ta mahsulotni yuklaydi

Agar "✅ Seed tugadi!" yozuvini ko'rsangiz — hammasi tayyor!

## Ishga tushirish (har safar)

```bash
npm run dev
```

Brauzerda oching: **http://localhost:3000**

---

## ⚠️ AGAR XATO BO'LSA

### Xato: "Cannot find module '@prisma/client'"
```bash
npx prisma generate
```

### Xato: "Table 'Table' does not exist"
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

### Xato: "tsx: command not found"
```bash
npm install -D tsx
npx tsx prisma/seed.ts
```

### Bazani butunlay qayta tiklash (hamma ma'lumot o'chadi!)
```bash
npm run db:reset
```

### Hech narsa yordam bermayapti?
1. `node_modules` papkasini o'chiring
2. `prisma/sohil.db` faylini o'chiring
3. Qayta: `npm install` → `npm run setup` → `npm run dev`

---

## 📋 Foydali buyruqlar

| Buyruq | Nima qiladi |
|--------|-------------|
| `npm run dev` | Dasturni ishga tushiradi (dev rejim) |
| `npm run build` | Prodakshn uchun tayyorlaydi |
| `npm run start` | Prodakshn rejimda ishga tushiradi |
| `npm run setup` | Baza + seed (1-marta) |
| `npm run db:seed` | Faqat seed (menyu/stollar qo'shish) |
| `npm run db:reset` | Bazani 0'dan boshlash |
