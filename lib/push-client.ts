"use client";

import { savePushSubscription, removePushSubscription } from "@/lib/actions/push";

/**
 * Brauzer tomonidagi Web Push yordamchilari.
 * Sozlamalar oynasidagi "Push bildirishnomalar" tugmasi shulardan foydalanadi.
 */

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

/** Brauzer web push'ni umuman qo'llab-quvvatlaydimi? */
export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** VAPID ochiq kalitini (base64url) Uint8Array'ga aylantiradi — subscribe uchun shart. */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration("/sw.js");
  if (existing) return existing;
  return navigator.serviceWorker.register("/sw.js");
}

export type PushResult = { ok: true } | { ok: false; error: string };

/**
 * Foydalanuvchini push'ga obuna qiladi:
 *   1) SW ro'yxatga olinadi
 *   2) ruxsat so'raladi
 *   3) PushManager obuna yaratadi
 *   4) obuna serverga (push_subscriptions) saqlanadi
 */
export async function enablePush(): Promise<PushResult> {
  if (!pushSupported()) {
    return { ok: false, error: "Brauzeringiz push bildirishnomalarni qo'llab-quvvatlamaydi" };
  }
  if (!VAPID_PUBLIC_KEY) {
    return { ok: false, error: "Push sozlanmagan (VAPID kaliti yo'q)" };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, error: "Bildirishnomaga ruxsat berilmadi" };
  }

  try {
    const registration = await registerServiceWorker();
    await navigator.serviceWorker.ready;

    // Avvalgi obuna bo'lsa qayta ishlatamiz, aks holda yangisini yaratamiz.
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const json = subscription.toJSON();
    const result = await savePushSubscription({
      endpoint: subscription.endpoint,
      p256dh: json.keys?.p256dh ?? "",
      auth: json.keys?.auth ?? "",
    });
    if (result.error) return { ok: false, error: result.error };

    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Noma'lum xato";
    return { ok: false, error: `Obuna bo'lishda xato: ${msg}` };
  }
}

/** Obunani bekor qiladi va serverdan o'chiradi. */
export async function disablePush(): Promise<PushResult> {
  if (!pushSupported()) return { ok: true };
  try {
    const registration = await navigator.serviceWorker.getRegistration("/sw.js");
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) {
      await removePushSubscription(subscription.endpoint);
      await subscription.unsubscribe();
    }
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Noma'lum xato";
    return { ok: false, error: msg };
  }
}
