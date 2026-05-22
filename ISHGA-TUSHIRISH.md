# Sohil Choyxona — Ishga tushirish yo'riqnomasi

## Loyiha haqida
Choyxona uchun POS tizimi. Ofitsiantlar buyurtma qabul qiladi, admin statistika ko'radi.

---

## 1. O'rnatish

```bash
git clone https://github.com/doston102030/soxilchoyhonaCRM.git
cd soxilchoyhonaCRM
npm install --legacy-peer-deps
```

---

## 2. Muhit o'zgaruvchilari

`.env.local` fayl yarating:

```env
DATABASE_URL="postgresql://..."
BLOB_READ_WRITE_TOKEN="..."
```

**DATABASE_URL** — Neon.tech dan oling:
1. neon.tech → New Project → Create
2. Connection string ni ko'chiring

**BLOB_READ_WRITE_TOKEN** — Vercel Blob dan oling:
1. Vercel → Storage → Create → Blob
2. Token ni ko'chiring

---

## 3. Ma'lumotlar bazasini sozlash

```bash
npx prisma db push
npm run db:seed
```

---

## 4. Ishga tushirish

```bash
npm run dev
```

Brauzerda: `http://localhost:3000`

---

## 5. Sahifalar

| Sahifa | URL | Tavsif |
|--------|-----|--------|
| Bosh sahifa | `/` | Barcha stollar |
| Buyurtma | `/order/[id]` | Mahsulot tanlash, to'lov |
| Admin | `/admin` | Hisobot, menyu, tarix |

---

## 6. Vercel deploy

Vercel Dashboard → Settings → Environment Variables:
- `DATABASE_URL`
- `BLOB_READ_WRITE_TOKEN`

---

## 7. Buyruqlar

```bash
npm run dev        # Development
npm run build      # Production build
npm run db:seed    # Ma'lumot kiritish
```
