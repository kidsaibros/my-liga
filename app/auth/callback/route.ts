import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncProfileRole } from "@/lib/auth-sync";

/** Google OAuth redirect shu yerga qaytadi: kodni sessiyaga almashtiradi, so'ng rolni sinxronlaydi. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/profil";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      try {
        const { role } = await syncProfileRole(data.user);
        // Murabbiy — jamoasi bor-yo'qligidan qat'i nazar to'g'ridan-to'g'ri Coach
        // Dashboard'ga (jamoasi bo'lmasa o'sha yerda "Jamoa yaratish" formasini ko'radi).
        const target = role === "coach" ? "/coach" : next;
        return NextResponse.redirect(`${origin}${target}`);
      } catch (err) {
        // Sessiya allaqachon ochilgan (login o'zi muvaffaqiyatli) — faqat rol
        // sinxronizatsiyasi (masalan, SUPABASE_SERVICE_ROLE_KEY yo'qligi sababli) xato
        // bersa ham foydalanuvchini xato sahifasida qoldirmaymiz, "profil_sync_error" bilan o'tkazamiz.
        console.error("syncProfileRole xatosi:", err);
        return NextResponse.redirect(`${origin}${next}?profile_sync_error=1`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/profil?auth_error=1`);
}
