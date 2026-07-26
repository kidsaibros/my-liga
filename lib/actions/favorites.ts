"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { idSchema } from "@/lib/validation/schemas";

export type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

export async function toggleFavorite(
  teamId: unknown,
  isFavorite: boolean
): Promise<ActionResult<{ teamId: string; isFavorite: boolean }>> {
  const parsedTeamId = idSchema.safeParse(teamId);
  if (!parsedTeamId.success) return { data: null, error: parsedTeamId.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Tizimga kirmagansiz" };

  if (isFavorite) {
    const { error } = await supabase
      .from("user_favorites")
      .insert({ user_id: user.id, team_id: parsedTeamId.data });
    if (error) return { data: null, error: error.message };
  } else {
    const { error } = await supabase
      .from("user_favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("team_id", parsedTeamId.data);
    if (error) return { data: null, error: error.message };
  }

  revalidatePath("/profil");
  return { data: { teamId: parsedTeamId.data, isFavorite }, error: null };
}
