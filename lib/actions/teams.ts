"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CACHE_TAGS } from "@/lib/cache";
import { idSchema, teamSchema } from "@/lib/validation/schemas";
import { friendlyDbError } from "@/lib/db-error";
import type { Team } from "@/lib/types";

export type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

function revalidateTeams() {
  revalidatePath("/admin");
  revalidatePath("/turnirlar");
  // Jamoa nomi/gerbi jadval, o'yinlar va to'purarlar ro'yxatiga join qilinadi.
  revalidateTag(CACHE_TAGS.standings, "max");
  revalidateTag(CACHE_TAGS.matches, "max");
  revalidateTag(CACHE_TAGS.playerStats, "max");
}

/** Jamoani (agar hali standings'da yo'q bo'lsa) tanlangan turnirga biriktiradi.
 * Trigger nom to'qnashsa unique_violation (23505) bilan xato beradi — shu holatda
 * chaqiruvchi funksiya (createTeam) yangi yaratilgan jamoani orqaga qaytarishi kerak. */
async function attachToTournament(
  supabase: Awaited<ReturnType<typeof createClient>>,
  teamId: string,
  tournamentId: string
): Promise<{ error: string | null }> {
  const { data: existing } = await supabase
    .from("standings")
    .select("id")
    .eq("tournament_id", tournamentId)
    .eq("team_id", teamId)
    .maybeSingle();
  if (existing) return { error: null };

  const { data: maxRow } = await supabase
    .from("standings")
    .select("pos")
    .eq("tournament_id", tournamentId)
    .order("pos", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextPos = (maxRow?.pos ?? 0) + 1;

  const { error } = await supabase
    .from("standings")
    .insert({ tournament_id: tournamentId, team_id: teamId, pos: nextPos });
  if (error) return { error: friendlyDbError(error.message, error.code) };
  return { error: null };
}

export async function createTeam(input: unknown, tournamentId?: unknown): Promise<ActionResult<Team>> {
  const parsed = teamSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0].message };
  }
  const parsedTournamentId = tournamentId ? idSchema.safeParse(tournamentId) : null;
  if (tournamentId && !parsedTournamentId?.success) {
    return { data: null, error: "Noto'g'ri turnir" };
  }

  const supabase = await createClient();
  // Admin panel orqali yaratilgan jamoa darhol "approved" — tasdiqlash oqimi faqat
  // murabbiyning o'zi yaratgan jamoalari (createOwnTeam, lib/actions/coach-team.ts) uchun.
  const { data, error } = await supabase
    .from("teams")
    .insert({ ...parsed.data, status: "approved" })
    .select()
    .single();
  if (error) return { data: null, error: friendlyDbError(error.message, error.code) };

  if (parsedTournamentId?.success) {
    const attach = await attachToTournament(supabase, data.id, parsedTournamentId.data);
    if (attach.error) {
      // Nom to'qnashuvi — endigina yaratilgan jamoani orqaga qaytaramiz, "yarim" holat qolmasin.
      await supabase.from("teams").delete().eq("id", data.id);
      return { data: null, error: attach.error };
    }
  }

  revalidateTeams();
  return { data: data as Team, error: null };
}

export async function updateTeam(id: unknown, input: unknown, tournamentId?: unknown): Promise<ActionResult<Team>> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { data: null, error: parsedId.error.issues[0].message };

  const parsed = teamSchema.safeParse(input);
  if (!parsed.success) return { data: null, error: parsed.error.issues[0].message };

  const parsedTournamentId = tournamentId ? idSchema.safeParse(tournamentId) : null;
  if (tournamentId && !parsedTournamentId?.success) {
    return { data: null, error: "Noto'g'ri turnir" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teams")
    .update(parsed.data)
    .eq("id", parsedId.data)
    .select()
    .single();
  if (error) return { data: null, error: friendlyDbError(error.message, error.code) };

  if (parsedTournamentId?.success) {
    const attach = await attachToTournament(supabase, parsedId.data, parsedTournamentId.data);
    if (attach.error) return { data: null, error: attach.error };
  }

  revalidateTeams();
  return { data: data as Team, error: null };
}

/** Super Admin: murabbiy yaratgan "pending" jamoani tasdiqlaydi/rad etadi. */
export async function approveTeam(id: unknown): Promise<ActionResult<Team>> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { data: null, error: parsedId.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teams")
    .update({ status: "approved" })
    .eq("id", parsedId.data)
    .select()
    .single();
  if (error) return { data: null, error: friendlyDbError(error.message, error.code) };

  revalidateTeams();
  return { data: data as Team, error: null };
}

export async function rejectTeam(id: unknown): Promise<ActionResult<Team>> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { data: null, error: parsedId.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teams")
    .update({ status: "rejected" })
    .eq("id", parsedId.data)
    .select()
    .single();
  if (error) return { data: null, error: friendlyDbError(error.message, error.code) };

  revalidateTeams();
  return { data: data as Team, error: null };
}

/** Allaqachon mavjud (tasdiqlangan) jamoani bir turnirga biriktiradi — admin panel
 * "Turnirga qo'shish" tanlovidan chaqiriladi. */
export async function assignTeamToTournament(
  teamId: unknown,
  tournamentId: unknown
): Promise<ActionResult<{ teamId: string; tournamentId: string }>> {
  const parsedTeamId = idSchema.safeParse(teamId);
  if (!parsedTeamId.success) return { data: null, error: "Noto'g'ri jamoa" };
  const parsedTournamentId = idSchema.safeParse(tournamentId);
  if (!parsedTournamentId.success) return { data: null, error: "Noto'g'ri turnir" };

  const supabase = await createClient();
  const attach = await attachToTournament(supabase, parsedTeamId.data, parsedTournamentId.data);
  if (attach.error) return { data: null, error: attach.error };

  revalidateTeams();
  return { data: { teamId: parsedTeamId.data, tournamentId: parsedTournamentId.data }, error: null };
}

export async function deleteTeam(id: unknown): Promise<ActionResult<{ id: string }>> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { data: null, error: parsedId.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.from("teams").delete().eq("id", parsedId.data);
  if (error) return { data: null, error: friendlyDbError(error.message, error.code) };

  revalidateTeams();
  return { data: { id: parsedId.data }, error: null };
}
