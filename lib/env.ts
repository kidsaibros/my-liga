import { z } from "zod";

/**
 * Muhit o'zgaruvchilarini ISHGA TUSHISHDA tekshiradi.
 *
 * Muammo: kod bo'ylab `process.env.NEXT_PUBLIC_SUPABASE_URL!` yozilgan edi.
 * TypeScript'ning `!` operatori faqat tipni tinchlantiradi, ish vaqtida hech
 * narsani kafolatlamaydi. O'zgaruvchi yo'q bo'lsa, ilova muammosiz ishga
 * tushib, birinchi so'rovda `Invalid URL` kabi tushunarsiz xato berardi.
 *
 * Endi xato deploy paytida, aniq xabar bilan chiqadi.
 *
 * Eslatma: `SUPABASE_SERVICE_ROLE_KEY` faqat serverda kerak va ixtiyoriy —
 * uni ishlatadigan `lib/supabase/admin.ts` o'zi tekshiradi. Brauzer bundle'ida
 * `process.env` ning faqat `NEXT_PUBLIC_` bilan boshlanadigan qismi mavjud,
 * shuning uchun bu fayl client'da ham xavfsiz import qilinadi.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string({ error: "NEXT_PUBLIC_SUPABASE_URL o'rnatilmagan" })
    .url("NEXT_PUBLIC_SUPABASE_URL to'liq URL bo'lishi kerak (https://... ko'rinishida)"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string({ error: "NEXT_PUBLIC_SUPABASE_ANON_KEY o'rnatilmagan" })
    .min(20, "NEXT_PUBLIC_SUPABASE_ANON_KEY juda qisqa — noto'g'ri qiymat"),
});

function parseEnv() {
  // Next.js `process.env.X` ni bundle vaqtida almashtiradi, shuning uchun
  // o'zgaruvchilar aniq nom bilan yozilishi shart (dinamik kalit ishlamaydi).
  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!parsed.success) {
    const sabablar = parsed.error.issues.map((i) => `  • ${i.message}`).join("\n");
    throw new Error(
      `Muhit o'zgaruvchilari noto'g'ri sozlangan:\n${sabablar}\n\n` +
        `Namuna uchun .env.example fayliga qarang.`
    );
  }

  return parsed.data;
}

export const env = parseEnv();
