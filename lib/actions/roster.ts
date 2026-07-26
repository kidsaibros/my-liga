"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { idSchema, playerSchema } from "@/lib/validation/schemas";
import { friendlyDbError } from "@/lib/db-error";
import type { Player } from "@/lib/types";

export type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

function revalidateRoster() {
  revalidatePath("/admin");
  revalidatePath("/profil");
}

export async function createRosterPlayer(input: unknown): Promise<ActionResult<Player>> {
  const parsed = playerSchema.safeParse(input);
  if (!parsed.success) return { data: null, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase.from("players").insert(parsed.data).select().single();
  if (error) return { data: null, error: friendlyDbError(error.message) };

  revalidateRoster();
  return { data: data as Player, error: null };
}

export async function updateRosterPlayer(id: unknown, input: unknown): Promise<ActionResult<Player>> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { data: null, error: parsedId.error.issues[0].message };

  const parsed = playerSchema.safeParse(input);
  if (!parsed.success) return { data: null, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("players")
    .update(parsed.data)
    .eq("id", parsedId.data)
    .select()
    .single();
  if (error) return { data: null, error: friendlyDbError(error.message) };

  revalidateRoster();
  return { data: data as Player, error: null };
}

export async function deleteRosterPlayer(id: unknown): Promise<ActionResult<{ id: string }>> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { data: null, error: parsedId.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.from("players").delete().eq("id", parsedId.data);
  if (error) return { data: null, error: friendlyDbError(error.message) };

  revalidateRoster();
  return { data: { id: parsedId.data }, error: null };
}
