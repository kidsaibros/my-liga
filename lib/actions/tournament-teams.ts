"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CACHE_TAGS } from "@/lib/cache";
import { idSchema } from "@/lib/validation/schemas";
import { friendlyDbError } from "@/lib/db-error";

export type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

function revalidateLeague() {
  revalidatePath("/admin");
  revalidatePath("/turnirlar");
  revalidatePath("/");
  revalidateTag(CACHE_TAGS.tournaments, "max");
}

/** Ligaga (turnirga) jamoani a'zo qiladi. */
export async function addTeamToTournament(
  tournamentId: unknown,
  teamId: unknown
): Promise<ActionResult<{ tournamentId: string; teamId: string }>> {
  const t = idSchema.safeParse(tournamentId);
  if (!t.success) return { data: null, error: "Noto'g'ri turnir" };
  const tm = idSchema.safeParse(teamId);
  if (!tm.success) return { data: null, error: "Noto'g'ri jamoa" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("tournament_teams")
    .upsert({ tournament_id: t.data, team_id: tm.data }, { onConflict: "tournament_id,team_id" });
  if (error) return { data: null, error: friendlyDbError(error.message, error.code) };

  revalidateLeague();
  return { data: { tournamentId: t.data, teamId: tm.data }, error: null };
}

/** Ligadan jamoani chiqaradi. */
export async function removeTeamFromTournament(
  tournamentId: unknown,
  teamId: unknown
): Promise<ActionResult<{ tournamentId: string; teamId: string }>> {
  const t = idSchema.safeParse(tournamentId);
  if (!t.success) return { data: null, error: "Noto'g'ri turnir" };
  const tm = idSchema.safeParse(teamId);
  if (!tm.success) return { data: null, error: "Noto'g'ri jamoa" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("tournament_teams")
    .delete()
    .eq("tournament_id", t.data)
    .eq("team_id", tm.data);
  if (error) return { data: null, error: friendlyDbError(error.message, error.code) };

  revalidateLeague();
  return { data: { tournamentId: t.data, teamId: tm.data }, error: null };
}
