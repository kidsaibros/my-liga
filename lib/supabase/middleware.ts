import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // createServerClient va token tekshiruvi orasiga logika qo'shmaslik kerak —
  // aks holda foydalanuvchilar tasodifiy tizimdan chiqarilishi mumkin (Supabase SSR tavsiyasi).
  //
  // TEZLIK: bu yerda avval `getUser()` turardi, u HAR BIR so'rovda (shu jumladan
  // har bir prefetch va navigatsiyada) Supabase auth serveriga tarmoq so'rovi
  // yuborardi — dev logida `proxy.ts: ~450ms` shundan edi, sahifa kodi esa atigi
  // ~20ms. `getClaims()` esa JWT'ni loyihaning JWKS'i bilan MAHALLIY tekshiradi
  // (WebCrypto), tarmoqqa chiqmaydi va token muddati tugayotgan bo'lsa sessiyani
  // yangilaydi. Xavfsizlik darajasi bir xil: imzo baribir tekshiriladi
  // (`getSession()` dan farqli, u imzoni umuman tekshirmaydi).
  //
  // ESLATMA: bu tezlik yutug'i loyiha ASIMMETRIK JWT imzolash kalitlaridan
  // (ECC/RSA) foydalansagina ishlaydi. Agar loyiha hali eski simmetrik "JWT
  // secret" da bo'lsa, `getClaims()` ham serverga so'rov yuboradi. Supabase
  // Dashboard → Authentication → JWT Keys bo'limidan asimmetrik kalitlarga
  // o'tish kifoya.
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub ?? null;

  function redirectTo(pathname: string) {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    const redirectResponse = NextResponse.redirect(url);
    // Yangilangan sessiya cookie'lari (agar bo'lsa) redirect javobiga ham
    // ko'chiriladi — aks holda refresh qilingan token yo'qolishi mumkin.
    supabaseResponse.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  }

  /**
   * Rolni faqat himoyalangan yo'nalishlarda so'raymiz — bu bitta qo'shimcha DB
   * so'rovi, ochiq sahifalarda umuman kerak emas.
   */
  async function hasRole(role: "super_admin" | "coach") {
    if (!userId) return false;
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", userId)
      .single();
    return profile?.role === role;
  }

  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!(await hasRole("super_admin"))) return redirectTo("/profil");
  }

  if (request.nextUrl.pathname.startsWith("/coach")) {
    // team_id shart emas — jamoasi hali yo'q murabbiy ham /coach'ga kirib,
    // shu yerda o'z jamoasini yaratadi (app/coach/page.tsx shu holatni ko'rsatadi).
    if (!(await hasRole("coach"))) return redirectTo("/");
  }

  return supabaseResponse;
}
