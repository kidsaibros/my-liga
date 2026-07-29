import "server-only";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Server tomonidan Web Push yuborish.
 *
 * VAPID kalitlari (muhit o'zgaruvchilari):
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY — ochiq kalit (brauzerga ham boradi)
 *   VAPID_PRIVATE_KEY            — MAXFIY, faqat serverda
 *   VAPID_SUBJECT                — "mailto:siz@example.com" yoki sayt URL'i
 *
 * Kalit yo'q bo'lsa, yuborish jimgina o'tkazib yuboriladi (ilova buzilmaydi).
 */

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

let configured = false;

function ensureConfigured(): boolean {
  if (configured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@myliga.app";
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

type Row = { id: string; endpoint: string; p256dh: string; auth: string };

async function sendToRows(rows: Row[], payload: PushPayload): Promise<void> {
  if (rows.length === 0) return;
  const admin = createAdminClient();
  const body = JSON.stringify(payload);
  const deadIds: string[] = [];

  await Promise.allSettled(
    rows.map(async (row) => {
      try {
        await webpush.sendNotification(
          { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
          body
        );
      } catch (err: unknown) {
        // 404/410 — obuna o'lgan (foydalanuvchi ruxsatni olib tashlagan). Tozalaymiz.
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) deadIds.push(row.id);
      }
    })
  );

  if (deadIds.length > 0) {
    await admin.from("push_subscriptions").delete().in("id", deadIds);
  }
}

/** Barcha obunachilarga xabar yuboradi (yangi turnir, yangilik uchun). */
export async function sendPushToAll(payload: PushPayload): Promise<void> {
  if (!ensureConfigured()) return;
  const admin = createAdminClient();
  const { data } = await admin.from("push_subscriptions").select("id, endpoint, p256dh, auth");
  await sendToRows((data ?? []) as Row[], payload);
}

/** Bitta foydalanuvchining barcha qurilmalariga xabar yuboradi. */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!ensureConfigured()) return;
  const admin = createAdminClient();
  const { data } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);
  await sendToRows((data ?? []) as Row[], payload);
}
