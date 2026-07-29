/* MY LIGA — Service Worker (Web Push).
 *
 * Vazifasi:
 *  1) `push` hodisasi — serverdan kelgan xabarni qurilma bildirishnomasi qilib
 *     ko'rsatadi (ilova yopiq bo'lsa ham).
 *  2) `notificationclick` — bildirishnoma bosilganda tegishli sahifani ochadi.
 *
 * Diqqat: bu fayl oddiy JS bo'lishi kerak (Next bundle emas), shuning uchun
 * `public/` ichida turadi va `/sw.js` manzilida ochiladi.
 */

self.addEventListener("install", () => {
  // Yangi service worker darhol faollashsin.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "MY LIGA", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "MY LIGA";
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || undefined, // bir xil tag — eski bildirishnomani almashtiradi
    data: { url: data.url || "/" },
    vibrate: [80, 40, 80],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Ilova allaqachon ochiq bo'lsa — o'sha oynani fokuslab, sahifaga o'tamiz.
      for (const client of clientList) {
        if ("focus" in client) {
          client.focus();
          if ("navigate" in client) client.navigate(target);
          return;
        }
      }
      // Aks holda yangi oyna ochamiz.
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});
