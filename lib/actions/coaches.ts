"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { idSchema } from "@/lib/validation/schemas";
import { friendlyDbError } from "@/lib/db-error";

export type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

function revalidateCoaches() {
  revalidatePath("/admin");
  revalidatePath("/profil");
}

/** Super Admin: ro'yxatdan o'tgan istalgan foydalanuvchini aniq bir jamoaga murabbiy qilib tayinlaydi. */
export async function assignCoach(
  userId: unknown,
  teamId: unknown
): Promise<ActionResult<{ userId: string; teamId: string }>> {
  const parsedUserId = idSchema.safeParse(userId);
  if (!parsedUserId.success) return { data: null, error: "Noto'g'ri foydalanuvchi" };
  const parsedTeamId = idSchema.safeParse(teamId);
  if (!parsedTeamId.success) return { data: null, error: "Noto'g'ri jamoa" };

  const supabase = await createClient();

  // Boshqa jamoada shu foydalanuvchi murabbiy sifatida qolib ketmasligi uchun tozalaymiz.
  await supabase
    .from("teams")
    .update({ coach_id: null })
    .eq("coach_id", parsedUserId.data)
    .neq("id", parsedTeamId.data);

  const { error: teamError } = await supabase
    .from("teams")
    .update({ coach_id: parsedUserId.data })
    .eq("id", parsedTeamId.data);
  if (teamError) return { data: null, error: friendlyDbError(teamError.message) };

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ role: "coach", team_id: parsedTeamId.data })
    .eq("user_id", parsedUserId.data);
  if (profileError) return { data: null, error: friendlyDbError(profileError.message) };

  revalidateCoaches();
  return { data: { userId: parsedUserId.data, teamId: parsedTeamId.data }, error: null };
}

/** Super Admin: murabbiylikni bekor qiladi — jamoa "murabbiysiz" holatga qaytadi. */
export async function revokeCoach(userId: unknown): Promise<ActionResult<{ userId: string }>> {
  const parsedUserId = idSchema.safeParse(userId);
  if (!parsedUserId.success) return { data: null, error: "Noto'g'ri foydalanuvchi" };

  const supabase = await createClient();

  await supabase
    .from("teams")
    .update({ coach_id: null, coach_email: null })
    .eq("coach_id", parsedUserId.data);

  const { error } = await supabase
    .from("profiles")
    .update({ role: "user", team_id: null })
    .eq("user_id", parsedUserId.data);
  if (error) return { data: null, error: friendlyDbError(error.message) };

  revalidateCoaches();
  return { data: { userId: parsedUserId.data }, error: null };
}
