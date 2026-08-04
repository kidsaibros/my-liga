import "server-only";
import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ProfileRole } from "@/lib/types";

/**
 * Google bilan har kirishda chaqiriladi (app/auth/callback/route.ts).
 * Rol/team_id manbasi doim shu funksiya — profilga qo'lda o'zgartirilmaydi:
 *   1) email === SUPER_ADMIN_EMAIL                       → super_admin
 *   2) teams.coach_id = user.id (Super Admin to'g'ridan-to'g'ri tayinlagan)
 *      YOKI teams.coach_email mos keladi (ro'yxatdan o'tishdan oldin taklif)
 *                                                          → coach + o'sha team_id
 *   3) coach_invites'da email bor (jamoasiz taklif)        → coach, team_id=null
 *      (kirgach o'zi jamoa yaratadi — app/coach sahifasi)
 *   4) aks holda                                          → user
 * RLS'ni chetlab o'tish uchun service-role klient ishlatiladi — chunki oddiy
 * foydalanuvchi sessiyasi o'z role/team_id'ini o'zgartira olmaydi (bilib turib,
 * 0009 migratsiyasidagi trigger orqali taqiqlangan).
 */
export async function syncProfileRole(user: User): Promise<{ role: ProfileRole; teamId: string | null }> {
  const admin = createAdminClient();
  const email = (user.email ?? "").toLowerCase().trim();
  // XAVFSIZLIK: super admin emaili SERVER-ONLY o'zgaruvchidan olinadi.
  // Ilgari `NEXT_PUBLIC_` prefiksi bilan edi — bu qiymat brauzer bundle'iga
  // ham joylanib, super admin emailini oshkor qilardi. Endi prefiksiz
  // `SUPER_ADMIN_EMAIL` ishlatiladi (client'ga chiqmaydi). Eski nom faqat
  // migratsiya davri uchun zaxira sifatida qoldirilgan — Vercel'da yangi
  // o'zgaruvchi o'rnatilgach, eskisini o'chirib tashlang.
  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL ?? process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL)
    ?.toLowerCase()
    .trim();

  let role: ProfileRole = "user";
  let teamId: string | null = null;

  if (superAdminEmail && email === superAdminEmail) {
    role = "super_admin";
  } else {
    const { data: team } = await admin
      .from("teams")
      .select("id, coach_id, coach_email")
      .or(`coach_id.eq.${user.id}${email ? `,coach_email.ilike.${email}` : ""}`)
      .maybeSingle();
    if (team) {
      role = "coach";
      teamId = team.id as string;
      // to'g'ridan-to'g'ri tayinlash orqali kelmagan bo'lsa (faqat email orqali topilgan
      // taklif), coach_id'ni ham to'ldiramiz — keyingi kirishlar tezroq/sodda bo'lishi uchun.
      if (!team.coach_id) {
        await admin.from("teams").update({ coach_id: user.id }).eq("id", team.id);
      }
    } else if (email) {
      const { data: invite } = await admin
        .from("coach_invites")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      if (invite) role = "coach";
    }
  }

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const fullName = (meta.full_name as string) || (meta.name as string) || email || "Foydalanuvchi";
  const avatarUrl = (meta.avatar_url as string) || (meta.picture as string) || null;

  await admin
    .from("profiles")
    .upsert(
      { user_id: user.id, email, full_name: fullName, avatar_url: avatarUrl, role, team_id: teamId },
      { onConflict: "user_id" }
    );

  return { role, teamId };
}
