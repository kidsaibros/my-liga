"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CACHE_TAGS } from "@/lib/cache";
import { idSchema, matchEventSchema } from "@/lib/validation/schemas";
import { friendlyDbError } from "@/lib/db-error";
import type { MatchEvent } from "@/lib/types";

export type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

function revalidateEvents() {
  revalidatePath("/admin");
  revalidatePath("/statistika");
  revalidatePath("/oyin");
  // «To'purarlar» tabi va /statistika shu tegga bog'langan.
  revalidateTag(CACHE_TAGS.playerStats, "max");
  // O'yin sahifasidagi gol tafsilotlari matches keshida keladi.
  revalidateTag(CACHE_TAGS.matches, "max");
}

export async function createMatchEvent(input: unknown): Promise<ActionResult<MatchEvent>> {
  const parsed = matchEventSchema.safeParse(input);
  if (!parsed.success) return { data: null, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("match_events")
    .insert({
      match_id: parsed.data.match_id,
      team_id: parsed.data.team_id,
      player_id: parsed.data.player_id ?? null,
      player_name: parsed.data.player_name,
      type: parsed.data.type,
      minute: parsed.data.minute ?? null,
    })
    .select()
    .single();
  if (error) return { data: null, error: friendlyDbError(error.message, error.code) };

  revalidateEvents();
  return { data: data as MatchEvent, error: null };
}

export async function deleteMatchEvent(id: unknown): Promise<ActionResult<{ id: string }>> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { data: null, error: parsedId.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.from("match_events").delete().eq("id", parsedId.data);
  if (error) return { data: null, error: friendlyDbError(error.message, error.code) };

  revalidateEvents();
  return { data: { id: parsedId.data }, error: null };
}

/** Bitta uchrashuvning barcha hodisalari — admin panelda tahrirlash uchun. */
export async function listMatchEvents(matchId: unknown): Promise<ActionResult<MatchEvent[]>> {
  const parsedId = idSchema.safeParse(matchId);
  if (!parsedId.success) return { data: null, error: parsedId.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("match_events")
    .select("*")
    .eq("match_id", parsedId.data)
    .order("minute", { ascending: true, nullsFirst: false });
  if (error) return { data: null, error: friendlyDbError(error.message, error.code) };

  return { data: (data ?? []) as MatchEvent[], error: null };
}
