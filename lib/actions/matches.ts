"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CACHE_TAGS } from "@/lib/cache";
import { idSchema, matchSchema, matchScoreSchema } from "@/lib/validation/schemas";
import { friendlyDbError } from "@/lib/db-error";
import type { Match } from "@/lib/types";

export type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

/** Uchrashuv jamoalar bilan birga qaytariladi — panel ro'yxatni darhol yangilaydi. */
const MATCH_SELECT =
  "*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)";

function revalidateMatches() {
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/turnirlar");
  revalidatePath("/oyin");
  // Turnir sahifasidagi «O'yinlar»/«Natijalar» tablari va bosh sahifadagi
  // «Yaqin o'yinlar» ro'yxati shu tegga bog'langan.
  revalidateTag(CACHE_TAGS.matches, "max");
}

/**
 * Faqat bitta uchrashuv "featured" bo'lishi mumkin (DB'da ham unikal indeks bor).
 * Yangisini belgilashdan oldin eskisini tushiramiz, aks holda insert/update
 * unikal indeks xatosi bilan yiqiladi.
 */
async function clearOtherFeatured(
  supabase: Awaited<ReturnType<typeof createClient>>,
  exceptId?: string
) {
  const q = supabase.from("matches").update({ is_featured: false }).eq("is_featured", true);
  if (exceptId) q.neq("id", exceptId);
  await q;
}

export async function createMatch(input: unknown): Promise<ActionResult<Match>> {
  const parsed = matchSchema.safeParse(input);
  if (!parsed.success) return { data: null, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  if (parsed.data.is_featured) await clearOtherFeatured(supabase);

  const { data, error } = await supabase.from("matches").insert(parsed.data).select(MATCH_SELECT).single();
  if (error) return { data: null, error: friendlyDbError(error.message, error.code) };

  revalidateMatches();
  return { data: data as unknown as Match, error: null };
}

export async function updateMatch(id: unknown, input: unknown): Promise<ActionResult<Match>> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { data: null, error: parsedId.error.issues[0].message };

  const parsed = matchSchema.safeParse(input);
  if (!parsed.success) return { data: null, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  if (parsed.data.is_featured) await clearOtherFeatured(supabase, parsedId.data);

  const { data, error } = await supabase
    .from("matches")
    .update(parsed.data)
    .eq("id", parsedId.data)
    .select(MATCH_SELECT)
    .single();
  if (error) return { data: null, error: friendlyDbError(error.message, error.code) };

  revalidateMatches();
  return { data: data as unknown as Match, error: null };
}

/** Hisob + holat (+ jonli o'yinda daqiqa) — panelda tez tahrirlash uchun alohida. */
export async function updateMatchScore(id: unknown, input: unknown): Promise<ActionResult<Match>> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { data: null, error: parsedId.error.issues[0].message };

  const parsed = matchScoreSchema.safeParse(input);
  if (!parsed.success) return { data: null, error: parsed.error.issues[0].message };

  const supabase = await createClient();

  // Yakunlangan o'yin bosh sahifada "jonli" bo'lib qolmasligi kerak.
  const patch =
    parsed.data.status === "finished"
      ? { ...parsed.data, is_featured: false }
      : parsed.data;

  const { data, error } = await supabase
    .from("matches")
    .update(patch)
    .eq("id", parsedId.data)
    .select(MATCH_SELECT)
    .single();
  if (error) return { data: null, error: friendlyDbError(error.message, error.code) };

  revalidateMatches();
  return { data: data as unknown as Match, error: null };
}

export async function deleteMatch(id: unknown): Promise<ActionResult<{ id: string }>> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { data: null, error: parsedId.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.from("matches").delete().eq("id", parsedId.data);
  if (error) return { data: null, error: friendlyDbError(error.message, error.code) };

  revalidateMatches();
  return { data: { id: parsedId.data }, error: null };
}
