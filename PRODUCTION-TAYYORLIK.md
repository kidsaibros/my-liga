# Production tayyorlik auditi

**Sana:** 26.07.2026 · **Xulosa:** ✅ **kodi tayyor** — barcha blokerlovchi kamchiliklar yopildi

---

## Tuzatilgan kamchiliklar

### 🔴 1. Live chat ishlamasdi → tuzatildi

**Muammo:** RLS siyosati `auth.uid() = user_id` ni talab qilardi, lekin
`MatchClient.sendMessage()` `user_id` ni umuman yubormasdi va muallif nomini
har doim `"Siz"` deb yozardi. Natijada **har bir xabar RLS tomonidan rad
etilardi**, natija esa tekshirilmagani uchun xato jimgina yo'qolardi —
foydalanuvchi xabari sabab ko'rsatilmasdan g'oyib bo'lardi.

**Yechim:**

- `user_id`, `author_name` va `author_init` sessiyadan olinadi
  (`useSessionProfile()`), ism bosh harflarga qisqartiriladi
- `insert` natijasidagi `error` ushlanadi: matn maydoniga qaytariladi va
  foydalanuvchiga «Xabar yuborilmadi» deb ko'rsatiladi
- Kirmagan foydalanuvchiga yozish maydoni o'rniga «Chatda yozish uchun
  hisobingizga kiring» chiqadi — RLS ham aynan shuni talab qiladi
- Bo'sh xabar yuborish tugmasi o'chirilgan, matn 500 belgiga cheklangan

### 🔴 2. Xato sahifalari yo'q edi → qo'shildi

| Fayl | Vazifasi |
|---|---|
| `app/error.tsx` | Sahifa darajasidagi xato — «Qayta urinish» va «Bosh sahifa» tugmalari, xato kodi |
| `app/global-error.tsx` | Root layout yiqilganda — o'z `<html>`/`<body>` si bilan, CSS o'zgaruvchilariga tayanmaydi |
| `app/not-found.tsx` | 404 — `notFound()` chaqirilganda (mavjud bo'lmagan turnir) va noma'lum yo'llarda |

Uchalasi ham o'zbek tilida va ilova dizayniga mos.

### 🔴 3. README va .env.example yo'q edi → yozildi

- `.env.example` — har bir o'zgaruvchi izohi bilan, `service_role` kaliti
  haqida alohida ogohlantirish
- `README.md` — o'rnatish, migratsiyalar, Google OAuth sozlash, skriptlar
  jadvali, arxitektura izohi (nega 4 ta Supabase klienti, nega ISR emas
  `"use cache"`, jadval qanday hisoblanadi), deploy qadamlari

### 🟡 4. Muhit o'zgaruvchilari tekshirilmasdi → `lib/env.ts`

`process.env.X!` o'rniga Zod validatsiyasi. O'zgaruvchi yetishmasa yoki
noto'g'ri bo'lsa, ilova **ishga tushishda** aniq o'zbekcha xabar bilan
to'xtaydi — birinchi so'rovdagi tushunarsiz `Invalid URL` o'rniga.
Beshta faylda (`server`, `client`, `public`, `admin`, `middleware`) qo'llandi.

### 🟡 5. Xavfsizlik sarlavhalari yo'q edi → `next.config.ts`

`X-Frame-Options: DENY` · `X-Content-Type-Options: nosniff` ·
`Referrer-Policy: strict-origin-when-cross-origin` ·
`Permissions-Policy` (kamera/mikrofon/geolokatsiya yopiq) ·
`Strict-Transport-Security`

CSP ataylab qo'shilmadi — ilova inline `style={{...}}` ga tayanadi, shuning
uchun to'g'ri CSP `unsafe-inline` talab qiladi va foyda bermaydi. Nonce
asosidagi yechim alohida ish.

---

## 🟡 Tuzatilmagan, lekin xavf tug'dirmaydi

### npm audit — 3 ta yuqori darajali zaiflik

```
next@16.2.12 → sharp@0.34.5 → libvips
```

- `sharp` faqat `next/image` uchun kerak. Loyihada `next/image` **0 marta**
  ishlatilgan — rasmlar oddiy `<img>` orqali. Ya'ni `libvips` ishonchsiz
  rasmni hech qachon qayta ishlamaydi.
- `npm audit fix` yordam bermaydi, `--force` esa Next.js'ni buzuvchi tarzda
  o'zgartiradi.
- Next.js yangilanishi bilan o'z-o'zidan yopiladi.

### Rate limiting yo'q

Chat va Server Action'lar cheklanmagan. Birinchi haqiqiy foydalanuvchilardan
keyin qo'shilsa bo'ladi — hozircha suiiste'mol qilish ehtimoli past, chunki
chat faqat kirgan foydalanuvchilar uchun.

---

## Yakuniy holat

| Tekshiruv | Natija |
|---|---|
| TypeScript | 0 xato |
| Testlar | 76/76 |
| Migratsiyalar (PGlite'da) | 21/21, 50 obyekt |
| `next build` | toza |
| RLS | 16 ta jadvalning hammasida |
| Git tarixida maxfiy ma'lumot | yo'q |
| `console.log` / `TODO` | 0 / 0 |

**Kod production'ga tayyor.**

---

## Kod bilan bog'liq bo'lmagan, lekin deploy'dan oldin hal qilinishi kerak

1. **Kompyuterda kriptomayner** — `hosts` fayli tozalandi, zararli dastur qoldi.
   Dr.Web CureIt yoki Kaspersky Virus Removal Tool bilan tozalang.
2. **Supabase `service_role` kalitini almashtiring** — u zararlangan mashinada
   turgan. Dashboard → Settings → API → Reset.
3. **Supabase regioni** `ap-southeast-2` (Sidney), Toshkentdan ~11 500 km.
   Keshlash buni yopadi (~10ms), lekin deploy paytida Frankfurtga
   (`eu-central-1`) ko'chirishni o'ylab ko'ring.
4. **Google OAuth redirect URL** — production domenini Supabase Dashboard'ga
   qo'shishni unutmang.
