import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js 16 `middleware.ts` konventsiyasini `proxy.ts` deb qayta nomladi
 * (eskisi ishlaydi, lekin har bir `next dev`/`next build` da deprecation
 * ogohlantirishi chiqaradi). Mantiq o'zgarmadi — har bir so'rovda Supabase
 * sessiya cookie'lari yangilanadi va rolga qarab yo'naltirish qilinadi.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Statik fayllar va rasm optimallashtirishdan tashqari barcha yo'llarda ishlaydi,
    // sessiya cookie'lari har bir sahifa so'rovida yangilanib turishi uchun.
    // manifest/robots/sitemap va ikonkalar ham chiqarib tashlandi — ular sessiyaga
    // bog'liq emas, lekin har sahifa yuklanishida ortiqcha proxy ishini keltirardi.
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
