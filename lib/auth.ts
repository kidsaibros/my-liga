import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { ProfileRole } from "@/lib/types";

export type SessionProfile = {
  userId: string;
  role: ProfileRole;
  teamId: string | null;
  fullName: string;
  avatarUrl: string | null;
};

/**
 * Joriy so'rov uchun kirgan foydalanuvchi profilini o'qiydi (rol + jamoa + ism + rasm).
 * Kirmagan bo'lsa null.
 *
 * `cache()` bilan o'ralgan: bitta so'rov ichida bir necha marta chaqirilsa
 * (masalan bosh sahifada `layout.tsx` ham, `page.tsx` ham chaqiradi) Supabase'ga
 * ikki marta emas, bir marta boriladi — bu har navigatsiyada 2 ta ortiqcha
 * tarmoq so'rovini olib tashlaydi.
 */
export const getSessionProfile = cache(async (): Promise<SessionProfile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, team_id, full_name, avatar_url")
    .eq("user_id", user.id)
    .single();
  if (!profile) return null;

  return {
    userId: user.id,
    role: profile.role as ProfileRole,
    teamId: profile.team_id,
    fullName: profile.full_name,
    avatarUrl: profile.avatar_url,
  };
});
