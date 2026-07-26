import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { env } from "@/lib/env";

/**
 * FAQAT ochiq (public) ma'lumotlarni o'qish uchun anon klient — cookie o'qimaydi,
 * sessiyani saqlamaydi.
 *
 * NEGA ALOHIDA KLIENT KERAK: `lib/supabase/server.ts` ichidagi `cookies()` chaqiruvi
 * Next.js'da sahifani majburan dinamik render qiladi, ya'ni `export const revalidate`
 * bilan ISR ishlamay qoladi. Turnirlar/statistika/yangiliklar kabi sahifalarda
 * foydalanuvchiga xos hech narsa yo'q, shuning uchun ular shu klient orqali
 * o'qiydi va keshlanadi.
 *
 * QOIDALAR:
 *   - Auth sessiyasiga bog'liq har qanday o'qish (profil, admin paneli, murabbiy
 *     kabineti, `pending` jamoalar) uchun `lib/supabase/server.ts` ishlatiladi.
 *   - Bu klient bilan HECH QACHON yozish (insert/update/delete) qilinmaydi —
 *     yozish faqat Server Action ichida, sessiyali klient orqali.
 *   - RLS baribir kuchda: bu klient anon rolida ishlaydi, ya'ni faqat
 *     "public read" policy'lari ruxsat bergan qatorlarni ko'radi.
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
