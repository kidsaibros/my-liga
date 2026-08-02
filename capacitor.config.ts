import type { CapacitorConfig } from "@capacitor/cli";

/**
 * MY LIGA — Capacitor (native ilova) konfiguratsiyasi.
 *
 * Bu SSR (server-render) Next.js ilova bo'lgani uchun native qobiq statik
 * fayllarni emas, jonli Vercel saytini yuklaydi ("remote-URL" usuli).
 * `webDir` faqat Capacitor talab qilgani uchun — u qisqa "yuklanmoqda" ekrani.
 *
 * appId — Google Play'dagi paket nomi (o'zgarmas, noyob bo'lishi kerak).
 */
const config: CapacitorConfig = {
  appId: "uz.myliga.app",
  appName: "MY LIGA",
  webDir: "capacitor-www",
  server: {
    url: "https://my-liga.vercel.app",
    androidScheme: "https",
  },
};

export default config;
