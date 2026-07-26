# MY LIGA

Havaskor futbol turnirlarini boshqarish platformasi. Turnirlar, jamoalar,
uchrashuvlar, jonli hisob, avtomatik hisoblanadigan turnir jadvali va
to'purarlar ro'yxati. Interfeys to'liq o'zbek tilida, mobil qurilmalar uchun
mo'ljallangan.

**Stek:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 ·
Supabase (Postgres + Auth + Realtime + Storage)

---

## Ishga tushirish

### 1. Talablar

- Node.js 20 yoki undan yuqori
- Supabase loyihasi ([supabase.com](https://supabase.com) da bepul yaratiladi)

### 2. O'rnatish

```bash
npm install
cp .env.example .env.local     # keyin .env.local ni to'ldiring
```

Kerakli o'zgaruvchilar `.env.example` da izohlari bilan yozilgan. Ilova ishga
tushishda ularni tekshiradi — biror qiymat yetishmasa, aniq xabar bilan
to'xtaydi (`lib/env.ts`).

### 3. Ma'lumotlar bazasi

Migratsiyalarni **tartib bilan** Supabase Dashboard → SQL Editor'da bajaring:

```
supabase/migrations/0001_init.sql
supabase/migrations/0002_admin_crud.sql
...
supabase/migrations/0021_match_events.sql
```

Tekshirish uchun `supabase/verify_schema.sql` ni ishga tushiring — u kutilgan
50 ta obyektni bittalab tekshirib, «✅ bor» / «❌ YO'Q» ro'yxatini beradi.

### 4. Google OAuth

Supabase Dashboard → Authentication → Providers → Google'ni yoqing va
`Redirect URL` ga qo'shing:

```
http://localhost:3000/auth/callback          # ishlab chiqish
https://sizning-domeningiz.uz/auth/callback  # production
```

### 5. Ishga tushirish

```bash
npm run dev        # http://localhost:3000
```

Birinchi Super Admin: `.env.local` dagi `NEXT_PUBLIC_SUPER_ADMIN_EMAIL` ga
o'z emailingizni yozing va Google orqali kiring — rol avtomatik beriladi.

---

## Skriptlar

| Buyruq | Vazifasi |
|---|---|
| `npm run dev` | Ishlab chiqish serveri |
| `npm run build` | Production build |
| `npm start` | Production serverni ishga tushirish |
| `npm run typecheck` | TypeScript tekshiruvi (`tsc --noEmit`) |
| `npm test` | Unit va komponent testlari (vitest) |
| `npm run test:watch` | Testlar kuzatuv rejimida |
| `npm run db:test` | **Migratsiyalarni haqiqiy Postgres'da sinash** (PGlite) |
| `npm run types:gen` | Supabase sxemasidan TypeScript tiplarini generatsiya qilish |

`npm run db:test` — barcha migratsiyalarni toza bazada ketma-ket ishga tushiradi,
sxemani tekshiradi va biznes mantiqni (jadval hisoblanishi, to'purarlar)
haqiqiy ma'lumot bilan sinaydi. **Har qanday SQL o'zgarishidan keyin ishlating.**

---

## Arxitektura

### Supabase klientlari — to'rttasi, har biri o'z vazifasi uchun

| Fayl | Qachon |
|---|---|
| `lib/supabase/server.ts` | Sessiyaga bog'liq o'qish (profil, admin, murabbiy) va barcha Server Action'lar |
| `lib/supabase/public.ts` | Ochiq ma'lumotni o'qish — cookie'siz, shuning uchun keshlanadi |
| `lib/supabase/client.ts` | Brauzer: Realtime chat |
| `lib/supabase/admin.ts` | `service_role`, RLS'ni chetlab o'tadi — faqat serverda |

### Keshlash

Sahifa darajasidagi ISR ishlamaydi: `app/layout.tsx` har so'rovda sessiyani
o'qiydi (`cookies()`), bu esa butun daraxtni dinamik qiladi. Shuning uchun
**ma'lumot** keshlanadi — `lib/cache.ts` da `"use cache"` direktivasi bilan.
Admin CRUD action'lari `revalidateTag(...)` chaqiradi, shuning uchun o'zgarish
darhol ko'rinadi.

### Xavfsizlik

- RLS **16 ta jadvalning hammasida** yoqilgan
- Rollar: `user` · `coach` · `super_admin` — yagona haqiqat manbai `profiles.role`
- `is_admin()`, `is_coach()`, `is_team_coach()` — SECURITY DEFINER funksiyalar,
  RLS ichida rekursiyasiz ishlatish uchun
- Rolni o'z-o'zidan ko'tarishga qarshi trigger (`prevent_role_self_escalation`)
- Zod validatsiyasi barcha Server Action'larda
- URL maydonlari faqat `http`/`https` qabul qiladi (XSS himoyasi)

### Turnir jadvali avtomatik hisoblanadi

`matches` jadvali o'zgarganda trigger `recalc_standings()` ni chaqiradi:
yakunlangan o'yinlardan o'yin/g'alaba/durang/mag'lubiyat/gollar/ochko va guruh
ichidagi o'rin qayta hisoblanadi. Ochko tizimi: g'alaba 3, durang 1.
O'rin tartibi: ochko → gol farqi → urilgan gol.

### To'purarlar turnir bo'yicha

Gollar `match_events` jadvalida saqlanadi va o'yinga bog'lanadi, o'yin esa
turnirga. Shuning uchun bir jamoa bir necha turnirda qatnashsa ham, gollar
aralashmaydi (`tournament_scorers()` funksiyasi).

---

## Loyiha tuzilishi

```
app/
  admin/          Super Admin paneli (turnirlar, o'yinlar, jamoalar, murabbiylar, ...)
  coach/          Murabbiy kabineti (tarkib, taktika, statistika)
  oyin/           Uchrashuv sahifasi: tarkib, ma'lumot, jonli chat
  turnirlar/      Turnirlar ro'yxati va tafsilotlar (5 ta tab)
  statistika/     To'purarlar / assistentlar / gol+pas
  profil/         Foydalanuvchi profili va sozlamalar
lib/
  actions/        Server Action'lar (Zod validatsiyasi bilan)
  supabase/       To'rtta klient
  cache.ts        Keshlangan ochiq so'rovlar
  env.ts          Muhit o'zgaruvchilari validatsiyasi
supabase/
  migrations/     0001 → 0021
  verify_schema.sql     Sxema tekshiruvi (faqat o'qiydi)
  test-migrations.mjs   Migratsiyalarni PGlite'da sinash
```

---

## Ma'lum zaifliklar

`npm audit` uchta yuqori darajali zaiflikni ko'rsatadi:

```
next@16.2.12 → sharp@0.34.5 → libvips
CVE-2026-33327, 33328, 35590, 35591
```

**Holat: amaliy xavf yo'q, tuzatib bo'lmaydi.**

- `sharp` faqat `next/image` orqali rasm optimallashtirish uchun ishlatiladi.
  Bu loyihada `next/image` **umuman ishlatilmaydi** (0 ta import) — homiy
  logotiplari oddiy `<img>` orqali ko'rsatiladi. Ya'ni `libvips` hech qachon
  ishonchsiz rasmni qayta ishlamaydi.
- `npm audit fix` yordam bermaydi: yagona yechim `--force`, u esa Next.js
  versiyasini buzuvchi tarzda o'zgartiradi.
- Next.js yangi versiyada `sharp` ni yangilaganda o'z-o'zidan yopiladi.
  Vaqti-vaqti bilan `npm outdated next` bilan tekshirib turing.

---

## Deploy

1. Vercel yoki boshqa Next.js hostingiga ulang
2. Muhit o'zgaruvchilarini `.env.example` bo'yicha kiriting
3. Google OAuth redirect URL'iga production domenini qo'shing
4. Barcha migratsiyalar bajarilganini `verify_schema.sql` bilan tasdiqlang

**Tavsiya:** Supabase regionini foydalanuvchilaringizga yaqin joydan tanlang.
Har bir keshlanmagan so'rov masofaga bog'liq — Toshkentdan Sidneyga ~112ms,
Frankfurtga ~60ms.
