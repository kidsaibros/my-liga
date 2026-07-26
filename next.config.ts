import type { NextConfig } from "next";

/**
 * Xavfsizlik sarlavhalari — barcha javoblarga qo'shiladi.
 *
 * CSP ataylab kiritilmagan: ilova inline `style={{...}}` va Next.js'ning inline
 * skriptlariga tayanadi, shuning uchun to'g'ri CSP `unsafe-inline` talab qiladi
 * va deyarli foyda bermaydi. Uni qo'shishdan oldin nonce asosidagi yechim
 * kerak — bu alohida ish.
 */
const securityHeaders = [
  // Sahifani boshqa saytga iframe ichida joylashtirishni taqiqlaydi (clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  // Brauzer MIME turini "taxmin qilishi"ni o'chiradi
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Tashqi saytlarga faqat domen nomi yuboriladi, to'liq yo'l emas
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Kerak bo'lmagan qurilma ruxsatlarini butunlay yopamiz
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  // HTTPS'ni majburiy qiladi (faqat production'da ma'noga ega)
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  experimental: {
    // `"use cache"` direktivasini yoqadi. Next 16'da `unstable_cache` endi
    // keshlamaydi (o'lchov: keshlangan chaqiruv ham har safar ~440ms olardi),
    // shuning uchun `lib/cache.ts` shu direktivaga o'tkazildi.
    useCache: true,
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
