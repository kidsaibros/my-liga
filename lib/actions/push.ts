"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { diagnoseAndTest } from "@/lib/push";

export type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

/** Admin uchun test: barcha obunalarga push yuboradi va aniq natijani qaytaradi. */
export async function testPush(): Promise<ActionResult<{ message: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Avval hisobingizga kiring" };

  const r = await diagnoseAndTest();
  if (!r.configured) {
    return { data: null, error: "VAPID kalitlar serverda yo'q — Vercel env qo'shib, Redeploy qiling" };
  }
  if (r.subscriptions === 0) {
    return { data: null, error: "Hech qanday obuna yo'q — Sozlamalar → Push'ni yoqing" };
  }
  // Kamida bitta tirik qurilmaga yetdi — muvaffaqiyat (o'lgan obunalar tozalandi).
  if (r.sent > 0) {
    return { data: { message: `✅ ${r.sent} ta qurilmaga yuborildi — bildirishnomani tekshiring` }, error: null };
  }
  // Hech biriga yetmadi. Agar hammasi o'lgan bo'lsa — tozaladik, qayta yoqish kerak.
  if (r.cleaned > 0) {
    return {
      data: null,
      error: `${r.cleaned} ta eski obuna o'chirildi. Endi Sozlamalar → Push'ni O'CHIRIB, QAYTA YOQING, so'ng qayta bosing.`,
    };
  }
  return { data: null, error: `Yuborishda xato: ${r.errors.join(" | ") || "noma'lum"}` };
}

const subscriptionSchema = z.object({
  endpoint: z.string().url("Noto'g'ri endpoint"),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
});

/** Foydalanuvchi push'ga obuna bo'lganda chaqiriladi — obunani saqlaydi (RLS: o'ziga tegishli). */
export async function savePushSubscription(input: unknown): Promise<ActionResult<{ endpoint: string }>> {
  const parsed = subscriptionSchema.safeParse(input);
  if (!parsed.success) return { data: null, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Avval hisobingizga kiring" };

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.p256dh,
      auth: parsed.data.auth,
    },
    { onConflict: "endpoint" }
  );
  if (error) return { data: null, error: error.message };

  return { data: { endpoint: parsed.data.endpoint }, error: null };
}

/** Obunani o'chiradi (push o'chirilganda yoki qurilma almashganda). */
export async function removePushSubscription(endpoint: unknown): Promise<ActionResult<{ endpoint: string }>> {
  const parsed = z.string().url().safeParse(endpoint);
  if (!parsed.success) return { data: null, error: "Noto'g'ri endpoint" };

  const supabase = await createClient();
  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", parsed.data);
  if (error) return { data: null, error: error.message };

  return { data: { endpoint: parsed.data }, error: null };
}
