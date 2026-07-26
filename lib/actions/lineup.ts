"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { lineupSchema } from "@/lib/validation/schemas";
import { friendlyDbError } from "@/lib/db-error";
import type { Lineup } from "@/lib/types";

export type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

/** Jamoaning joriy taktik sxemasi — bitta qator (team_id UNIQUE), har safar upsert qilinadi. */
export async function saveLineup(input: unknown): Promise<ActionResult<Lineup>> {
  const parsed = lineupSchema.safeParse(input);
  if (!parsed.success) return { data: null, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lineups")
    .upsert({ ...parsed.data, updated_at: new Date().toISOString() }, { onConflict: "team_id" })
    .select()
    .single();
  if (error) return { data: null, error: friendlyDbError(error.message) };

  revalidatePath("/admin");
  revalidatePath("/profil");
  return { data: data as Lineup, error: null };
}
