"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CACHE_TAGS } from "@/lib/cache";
import { idSchema, playerStatSchema } from "@/lib/validation/schemas";
import type { PlayerStat } from "@/lib/types";

export type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

function revalidatePlayers() {
  revalidatePath("/admin");
  revalidatePath("/statistika");
  // «To'purarlar» tabi ham shu ma'lumotga tayanadi.
  revalidateTag(CACHE_TAGS.playerStats, "max");
}

export async function createPlayer(input: unknown): Promise<ActionResult<PlayerStat>> {
  const parsed = playerStatSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("player_stats")
    .insert(parsed.data)
    .select("*, team:teams(*)")
    .single();
  if (error) return { data: null, error: error.message };

  revalidatePlayers();
  return { data: data as PlayerStat, error: null };
}

export async function updatePlayer(id: unknown, input: unknown): Promise<ActionResult<PlayerStat>> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { data: null, error: parsedId.error.issues[0].message };

  const parsed = playerStatSchema.safeParse(input);
  if (!parsed.success) return { data: null, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("player_stats")
    .update(parsed.data)
    .eq("id", parsedId.data)
    .select("*, team:teams(*)")
    .single();
  if (error) return { data: null, error: error.message };

  revalidatePlayers();
  return { data: data as PlayerStat, error: null };
}

export async function deletePlayer(id: unknown): Promise<ActionResult<{ id: string }>> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { data: null, error: parsedId.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.from("player_stats").delete().eq("id", parsedId.data);
  if (error) return { data: null, error: error.message };

  revalidatePlayers();
  return { data: { id: parsedId.data }, error: null };
}
