# My Liga — yakunlash seansi qaydlari

## Ishga tushirishdan oldin (majburiy 2 qadam)

1. **Yangi paketlarni o'rnating** (test infratuzilmasi qo'shildi):

   ```bash
   npm install
   ```

2. **0017-migratsiyani Supabase'da bajaring**
   (`supabase/migrations/0017_tournament_regulations_and_indexes.sql`) — busiz
   «Reglament» tabi bo'sh ko'rinadi, chunki `tournaments.regulations` ustuni yo'q.

Keyin:

```bash
npm run typecheck   # tsc --noEmit
npm test            # vitest run
npm run dev
```

---

## Bajarilgan ishlar

### 1. Turnir tafsilotlari — 4 ta tab yopildi

Avval faqat «Jadval» ishlar, qolgan to'rttasi «tez orada» deb turardi.

| Tab | Manba |
|---|---|
| O'yinlar | `matches` — `status in ('scheduled','live')`, `kickoff_at` o'sish bo'yicha. Jonli o'yin alohida belgilanadi (daqiqasi bilan). |
| Natijalar | `matches` — `status = 'finished'`, `kickoff_at` kamayish bo'yicha. G'olib qalin shriftda. |
| To'purarlar | `player_stats`, turnir tarkibidagi jamoalar bo'yicha filtrlangan (`standings` orqali). Golsizlar chiqarib tashlanadi, top-10. |
| Reglament | `tournaments.regulations` — har bir qator alohida raqamlangan band. |

Har bir tabning bo'sh holati ham bor.

### 2. Eski umumiy Supabase klienti olib tashlandi

`lib/supabase.ts` (modul darajasidagi anon singleton) 8 ta faylda ishlatilardi —
o'chirildi. Endi 4 ta aniq klient:

| Klient | Qayerda |
|---|---|
| `lib/supabase/server.ts` | Sessiyaga bog'liq o'qish (`/`, `/admin`, `/profil`, `/coach`, `/oyin`) va barcha Server Action'lar |
| `lib/supabase/client.ts` | Brauzer (`MatchClient` — live chat va Realtime) |
| `lib/supabase/public.ts` | **YANGI** — cookie'siz anon klient, faqat ochiq ma'lumotni o'qish uchun |
| `lib/supabase/admin.ts` | service-role, faqat server |

**Bu shunchaki refaktoring emas:** `/admin` sahifasi anon klient bilan o'qigani
uchun `is_admin()` ga tayanadigan RLS policy'lari ishlamasdi — `pending` jamoalar
va `app_settings` admin panelida ko'rinmasdi. Live chat ham anon sifatida yozardi.

### 3. Tiplar generatsiya qilingan sxemadan olinadi

- `lib/database.types.ts` — `supabase gen types` shaklidagi to'liq `Database` tipi
  (0001–0017 migratsiyalaridan), FK munosabatlari bilan.
- `lib/types.ts` endi qo'lda yozilgan ustun ro'yxati emas — `Tables<"...">` dan
  kelib chiqadi, faqat CHECK-constraint union'lari ustma-ust qo'yiladi.
- Barcha 4 klient `<Database>` generigi bilan tiplangan.
- Yangilash: `npm run types:gen` (yoki `npx supabase gen types typescript --project-id <ID>`).

### 4. Keshlash — sahifa emas, ma'lumot darajasida

`export const revalidate` bu loyihada **ishlamaydi**: `app/layout.tsx` har so'rovda
`getSessionProfile()` → `cookies()` chaqiradi, bu butun daraxtni dinamik qiladi
(`next build` chiqishida hamma yo'nalish `ƒ Dynamic`).

Shuning uchun `lib/cache.ts` — `unstable_cache` bilan o'ralgan ochiq so'rovlar,
teglar bo'yicha bekor qilinadi:

| Funksiya | Muddat | Teg |
|---|---|---|
| `getTournaments()` | 300s | `tournaments` |
| `getNews()` | 300s | `news` |
| `getPlayerStats()` | 60s | `player-stats` |
| `getTournamentDetail(slug)` | 60s | `tournaments`, `standings`, `matches`, `player-stats` |

Admin CRUD action'lari mos `revalidateTag(...)` ni chaqiradi — o'zgarish darhol
ko'rinadi, kesh muddati tugashini kutmaydi.

### 5. Xavfsizlik tuzatishi — `javascript:` URL

`optionalUrlSchema` `z.url()` ga tayanardi, u esa `javascript:alert(1)` va
`data:text/html;...` ni ham **to'g'ri URL** deb qabul qiladi. Bu qiymatlar homiy
havolasi/logotipi sifatida saqlanib, `<a href>` yoki CSS `url()` ichiga tushardi.
Endi faqat `http://` va `https://` ga ruxsat.

Yonida yana bitta xatolik topildi: `.optional().or(z.literal("")...)` naqshi bo'sh
satrni `undefined` ga aylantirmasdi (chunki birinchi shox "" ni qabul qilib
yuborardi) — DB'ga `NULL` o'rniga bo'sh satr yozilardi. `emptyToUndefined()`
yordamchisi bilan tuzatildi.

### 6. Testlar (0 → 44)

- `lib/format.test.ts` — sana formati, slugify (7)
- `lib/db-error.test.ts` — Postgres xatolarini tarjima qilish (5)
- `lib/validation/schemas.test.ts` — Zod sxemalari, XSS himoyasi (25)
- `app/turnirlar/[slug]/TournamentDetailClient.test.tsx` — 5 ta tabni bosib
  o'tish, bo'sh holatlar, golsizlarni filtrlash (7)

### 7. Migratsiya 0017

`tournaments.regulations` ustuni + namuna reglament (mavjud turnirlarga bir marta),
`matches(tournament_id, status, kickoff_at)` composite indeksi, `player_stats`
indekslari va grantlari.

---

## Tekshiruv natijalari

Toza `npm install` qilingan nusxada (Linux):

| Tekshiruv | Natija |
|---|---|
| `tsc --noEmit` | 0 xato |
| `vitest run` | 44/44 o'tdi |
| `next build` | muvaffaqiyatli |
| `next start` + `/`, `/turnirlar`, `/statistika`, `/yangiliklar`, `/oyin` | hammasi 200 |

Sandbox'da Supabase va Google Fonts tarmoqdan yopiq, shuning uchun **jonli DB
bilan** tekshiruv qilinmadi — buni siz `npm run dev` bilan bajarasiz.

---

## Jonli DB bilan tekshiruv (0017 bajarilgandan keyin)

Brauzerda `localhost:3000` da haqiqiy Supabase ma'lumoti bilan tekshirildi.
Barcha 5 tab ishlaydi: Jadval (6 jamoa), O'yinlar (3 uchrashuv), Natijalar,
To'purarlar (5 o'yinchi), Reglament (10 band). `/admin` kirmagan foydalanuvchini
`/profil` ga yo'naltiradi — himoya joyida.

Shu tekshiruvda 3 ta muammo topildi va tuzatildi:

### 1. Har bir sahifada hydration xatosi

Brauzer kengaytmasi (parol menejeri) React yuklanguncha `<body>` ga
`bis_register` va `__processed_...` atributlarini qo'shib qo'yardi — bu har
sahifada konsolda hydration mismatch xatosi berardi.
`<body suppressHydrationWarning>` qo'shildi (`<html>` da allaqachon bor edi).

### 2. Jonli o'yin «Kelgusi o'yinlar» ro'yxatida turardi

«O'yinlar» tabida hozir ketayotgan uchrashuv (JONLI 72') kelgusi o'yinlar
qatoriga tushib qolgan edi. Endi u alohida «Hozir o'ynalmoqda» bo'limida,
kelgusi o'yinlar sanoqchisi esa faqat `scheduled` larni hisoblaydi.

### 3. `middleware.ts` deprecation ogohlantirishi

Next 16 bu konventsiyani `proxy.ts` deb qayta nomlagan. Fayl ko'chirildi
(`export async function proxy`), mantiq o'zgarmadi. Har `npm run dev` da
chiqadigan ogohlantirish yo'qoldi, `/admin` himoyasi ishlashda davom etmoqda.

Yakuniy holat: **tsc 0 xato · 45/45 test · `next build` toza · brauzer konsoli
bo'sh · server logida faqat 200 lar**.

---

## Navigatsiya sekinligi — sabab va yechim

Shikoyat: pastki paneldagi «Profil»/«Bosh sahifa» bosilgandan keyin 1-2 soniya
kutish. Brauzerda o'lchov qilib, to'rtta alohida sabab topildi.

### 1. `proxy.ts` har so'rovda auth serveriga borardi (eng katta sabab)

`updateSession()` ичida `supabase.auth.getUser()` turardi — bu HAR BIR so'rovda
Supabase auth serveriga tarmoq so'rovi yuboradi. Dev logidagi o'lchov:

```
GET /statistika 200 in 447ms (next.js: 4ms, proxy.ts: 422ms, application-code: 21ms)
```

Ya'ni sahifa kodi 21ms, proxy esa 422ms. `getClaims()` ga o'tkazildi — u JWT'ni
loyihaning JWKS'i bilan mahalliy tekshiradi. Natija:

```
GET /statistika 200 in 107ms (next.js: 6ms, proxy.ts: 4ms, application-code: 83ms)
```

**proxy.ts: 422ms → 4ms.**

> Eslatma: bu tezlik loyiha asimmetrik JWT kalitlaridan foydalansagina to'liq
> ishlaydi. Supabase Dashboard → Authentication → JWT Keys da tekshiring.

### 2. `unstable_cache` Next 16'da umuman keshlamas ekan

Vaqtinchalik diagnostika endpoint bilan o'lchandi:

```
xom so'rov:   417ms
keshlangan:   434ms   ← kesh umuman ishlamayapti
```

`lib/cache.ts` `"use cache"` direktivasiga o'tkazildi
(`next.config.ts` da `experimental.useCache: true`). Endi takroriy so'rovda
`application-code` 83ms → 20ms tushadi.

### 3. Pastki panel `<Link>` emas, `router.push()` ishlatardi

`router.push()` sahifani OLDINDAN yuklamaydi — bosilgandan keyingina so'rov
ketadi. `<Link prefetch>` ga o'tkazildi. Qo'shimcha: `useLinkStatus()` bilan
bosilgan tugma server javobini kutmasdan darhol yashil bo'ladi.

### 4. Yuklanish holati yo'q edi

`app/loading.tsx` va `app/turnirlar/[slug]/loading.tsx` qo'shildi — endi
navigatsiya bosilishi bilan sahifa shakli (skeleton) darhol ko'rinadi.

Bundan tashqari `getSessionProfile()` `cache()` bilan o'raldi: bosh sahifada
`layout.tsx` ham, `page.tsx` ham uni chaqirardi — endi so'rov ikki marta emas,
bir marta ketadi.

### MUHIM: prefetch faqat production'da ishlaydi

Next.js `<Link>` prefetch'ni dev rejimida ataylab o'chirib qo'yadi
(`link.js`: `if (!prefetchEnabled || process.env.NODE_ENV === 'development') return`).
Shuning uchun tezlanishning to'liq ta'sirini `npm run dev` da ko'rib bo'lmaydi:

```bash
npm run build
npm start
```

### O'lchov natijalari (server tomoni, dev)

| Yo'nalish | Oldin | Keyin |
|---|---|---|
| `/statistika` | 447ms (proxy 422ms) | 107ms (proxy 4ms) |
| `/` | ~600ms | 71–93ms |
| `/profil` | ~240ms | ~100ms |

### Qolgan kechikish haqida

Supabase'gacha bo'lgan tarmoq kechikishi bu kompyuterdan **~420ms** (brauzerdan
"issiq" ulanish esa ~112ms). Ya'ni har bir keshlanmagan DB so'rovi ~0.4s turadi.
Agar Supabase loyihasi uzoq regionda bo'lsa, uni Yevropa/Yaqin Sharq regioniga
ko'chirish sezilarli yutuq beradi — bu kod bilan hal qilinmaydi.

---

## Production o'lchovi — natija

`npm run build` + `npm start -p 3001` da o'lchandi (median, 6 ta so'rov):

| Yo'nalish | Dev (3000) | Production (3001) |
|---|---|---|
| `/turnirlar` | 469ms | **11ms** |
| `/statistika` | 467ms | **9ms** |
| `/yangiliklar` | 480ms | **10ms** |
| `/turnirlar/dxx-kubogi` | ~470ms | **11ms** |

Birinchi so'rov keshni to'ldiradi (~450ms = bitta Supabase borish-kelishi),
keyingilari ~10ms. Ya'ni `"use cache"` production'da mukammal ishlayapti.

Bosh sahifa (`/`) o'lchovda 651ms bo'lib qolgan edi — chunki u kesh qatlamidan
foydalanmasdan Supabase'ga to'g'ridan-to'g'ri 3 ta so'rov yuborardi. U ham
`getHomeData()` ga o'tkazildi.

**Xulosa:** region ko'chirish shoshilinch emas. Kesh muddati ichidagi so'rovlar
~10ms, faqat kesh yangilanganda bir marta ~450ms to'lanadi.

---

## Admin panelda «O'yinlar» bo'limi (yangi)

Loyihaning asosiy kamchiligi — `matches` jadvaliga yozib bo'lmasligi — yopildi.

**Qo'shildi:**

- `supabase/migrations/0018_match_integrity.sql` — jamoa o'zi bilan o'ynay
  olmasligi, manfiy hisob taqiqi, daqiqa 0–130 oralig'i, aniq dublikat taqiqi,
  bir vaqtda faqat bitta «asosiy» uchrashuv (unikal indeks).
- `matchSchema` va `matchScoreSchema` (Zod). `matchScoreSchema` jonli
  bo'lmagan o'yinda `minute` ni avtomat `null` ga tushiradi.
- `lib/actions/matches.ts` — `createMatch`, `updateMatch`, `updateMatchScore`,
  `deleteMatch`. Yangi «asosiy» belgilanganda eskisi avtomat tushiriladi;
  o'yin yakunlanganda `is_featured` o'chadi.
- `app/admin/MatchesPanel.tsx` — turnir bo'yicha filtr, uchrashuv yaratish/
  tahrirlash/o'chirish, alohida tez «Hisob» rejimi (hisob + holat + daqiqa).

## Jadval avtomatik hisoblanishi (0019)

`recalc_standings(tournament_id)` funksiyasi + `matches` jadvalidagi trigger.
Uchrashuv qo'shilganda/o'zgarganda/o'chirilganda o'sha turnir jadvali to'liq
qayta hisoblanadi:

- yakunlangan o'yinlardan o'yin / g'alaba / durang / mag'lubiyat / gollar
- ochko = g'alaba × 3 + durang
- o'rin: ochko → gol farqi → urilgan gol (guruh ichida alohida)
- o'ynagan, lekin jadvalda yo'q jamoa avtomat qo'shiladi

`teams.ts` da jamoa turnirga biriktirilganda ham `recalc_standings` RPC
chaqiriladi — aks holda yangi jamoa qo'lda qo'yilgan `pos` bilan qolib ketardi.

**⚠️ Mavjud namunaviy jadval haqida:** migratsiya mavjud qatorlarni darhol
o'zgartirmaydi. Turnirning birinchi o'yini kiritilganda o'sha turnir jadvali
real ma'lumotga o'tadi — ya'ni 0001'dagi «6 o'yin, 15 ochko» kabi namunaviy
qiymatlar nolga tushadi. Bu kutilgan xatti-harakat, lekin **DB o'zgarishini git
qaytarmaydi.** Hoziroq hammasini qayta hisoblamoqchi bo'lsangiz, 0019 faylining
oxiridagi izohli `select public.recalc_standings(id) from public.tournaments;`
qatorini ishga tushiring.

---

## O'yin sahifasi to'liq yakunlandi

3 tadan 2 ta tugallanmagan tab yozildi:

- **Tarkib** — har bir jamoa uchun taktik sxema (`lineups.formation`), asosiy
  tarkib pozitsiya bo'yicha guruhlangan (GK/DEF/MID/FWD), kapitan «K» belgisi
  bilan, zaxira alohida. Roster bo'sh bo'lsa — «Tarkib hali kiritilmagan».
- **O'yin haqida** — turnir, guruh, sana/vaqt, joy, holat + ikkala jamoaning
  turnir jadvalidagi o'rni va ochkolari.

---

## Loyiha holati — inventarizatsiya (26.07.2026)

Kod hajmi: **8 608 qator** (app + components + lib), 9 sahifa, 15 ta action fayli,
17 migratsiya, 45 test.

### Tayyor va ishlaydi

| Bo'lim | Holat |
|---|---|
| Auth (Google OAuth, rollar) | ✅ |
| RLS + `is_admin()`/`is_coach()`/`is_team_coach()` | ✅ |
| Turnirlar ro'yxati + 5 ta tab | ✅ |
| Statistika (to'purarlar/assistentlar/gol+pas) | ✅ |
| Yangiliklar | ✅ |
| Profil (sozlamalar, sevimlilar, yordam) | ✅ |
| Admin: turnirlar, jamoalar, murabbiylar, yangiliklar, homiylar, sozlamalar | ✅ |
| Murabbiy kabineti: tarkib, taktika, statistika, turnirlar | ✅ |
| Jamoa tasdiqlash oqimi + bildirishnomalar | ✅ |
| Live chat (Realtime) | ✅ |

### ❗ ASOSIY KAMCHILIK: `matches` jadvaliga yozadigan kod YO'Q

Butun kod bazasida `matches` ga `insert`/`update`/`delete` qiladigan birorta joy
yo'q — na admin paneli, na server action, na Zod sxemasi. Hozirgi barcha o'yinlar
`0001_init.sql` dagi seed'dan kelgan.

Amalda bu degani:

- yangi uchrashuv **qo'shib bo'lmaydi**
- hisobni **kiritib bo'lmaydi**
- o'yinni «yakunlangan» deb **belgilab bo'lmaydi**
- shuning uchun «Natijalar» tabi doim bo'sh, jonli o'yin abadiy 72-daqiqada turadi

`standings` ham shunga o'xshash: `teams.ts` jamoani turnirga biriktirganda nol
qiymatli qator yaratadi, lekin `played/won/points` ni **hech narsa yangilamaydi**.

Ya'ni turnir boshqaruv platformasining eng asosiy vazifasi — natija kiritish —
hali yo'q. Tashqaridan ilova tayyordek ko'rinadi, lekin haqiqiy turnirni olib
bora olmaydi.

### Qolgan ishlar va taxminiy hajm

| # | Ish | Muhimlik | Holat |
|---|---|---|---|
| 1 | `matches` CRUD: admin panel + action + Zod | 🔴 blokerlovchi | ✅ bajarildi |
| 2 | `standings` avtomatik hisoblash (trigger) | 🔴 blokerlovchi | ✅ bajarildi |
| 3 | O'yin sahifasi: «Tarkib» va «O'yin haqida» tablari | 🟡 muhim | ✅ bajarildi |
| 4 | Git repo + commitlar | 🔴 | ✅ bajarildi |
| 5 | `player_stats` ni turnirga bog'lash (hozir gollar turnirlar aro aralashadi) | 🟡 muhim | ⬜ qoldi (~0.5 kun) |
| 6 | `match_events` (kim, nechanchi daqiqada gol urdi) — gol statistikasi avtomat to'lishi uchun | 🟢 | ⬜ qoldi (~1 kun) |
| 7 | E2E testlar (auth oqimi, admin CRUD) | 🟢 | ⬜ qoldi (~1 kun) |

**Ilova endi haqiqiy turnirni olib bora oladi:** turnir yaratish → jamoalarni
biriktirish → uchrashuvlar tuzish → hisob kiritish → jadval avtomat yangilanadi.

---

## Qolgan tavsiyalar (bajarilmadi)

1. **Git repo yo'q.** Papkada `.git` topilmadi. `git init` + birinchi commit —
   eng ustuvor keyingi qadam.
2. **`player_stats` turnirga bog'lanmagan.** «To'purarlar» hozir jamoa bo'yicha
   filtrlanadi — bir jamoa bir nechta turnirda qatnashsa, gollar aralashadi.
   To'g'ri yechim: `player_stats` ga `tournament_id` qo'shish.
3. **E2E test yo'q.** Auth oqimi va admin CRUD hali faqat qo'lda tekshiriladi.
4. **Brauzer kengaytmasi hydration ogohlantirishi.** Konsolda `bis_skin_checked`
   atributi haqida xato chiqsa — bu Bitdefender/antivirus kengaytmasi sahifa
   ichidagi `<div>` larga o'z atributini qo'shayotgani. Kodda tuzatib
   bo'lmaydi (React faqat `<body>`/`<html>` uchun `suppressHydrationWarning`
   beradi); incognito rejimida yo'qoladi va production'ga ta'sir qilmaydi.
