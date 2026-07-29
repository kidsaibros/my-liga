"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CACHE_TAGS } from "@/lib/cache";
import { sendPushToAll } from "@/lib/push";
import { idSchema, tournamentSchema } from "@/lib/validation/schemas";
import { friendlyDbError } from "@/lib/db-error";
import type { Tournament } from "@/lib/types";

export type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

function revalidateTournaments() {
  revalidatePath("/admin");
  revalidatePath("/turnirlar");
  revalidatePath("/");
  // Sahifalar dinamik bo'lgani uchun asosiy kesh `lib/cache.ts` dagi
  // unstable_cache — uni teg orqali bekor qilamiz (aks holda admin
  // o'zgartirishi 5 daqiqagacha ko'rinmay turadi).
  revalidateTag(CACHE_TAGS.tournaments, "max");
}

export async function createTournament(input: unknown): Promise<ActionResult<Tournament>> {
  const parsed = tournamentSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("tournaments").insert(parsed.data).select().single();
  if (error) return { data: null, error: error.message };

  revalidateTournaments();

  // Barcha obunachilarga push xabar (push sozlanmagan bo'lsa jimgina o'tkaziladi).
  try {
    await sendPushToAll({
      title: "🏆 Yangi turnir",
      body: (data as Tournament).name,
      url: "/turnirlar",
      tag: "tournament",
    });
  } catch {
    // Push xatosi turnir yaratishni buzmasin.
  }

  return { data: data as Tournament, error: null };
}

export async function updateTournament(id: unknown, input: unknown): Promise<ActionResult<Tournament>> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { data: null, error: parsedId.error.issues[0].message };

  const parsed = tournamentSchema.safeParse(input);
  if (!parsed.success) return { data: null, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tournaments")
    .update(parsed.data)
    .eq("id", parsedId.data)
    .select()
    .single();
  if (error) return { data: null, error: error.message };

  revalidateTournaments();
  return { data: data as Tournament, error: null };
}

export async function deleteTournament(id: unknown): Promise<ActionResult<{ id: string }>> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { data: null, error: parsedId.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.from("tournaments").delete().eq("id", parsedId.data);
  if (error) return { data: null, error: friendlyDbError(error.message) };

  revalidateTournaments();
  return { data: { id: parsedId.data }, error: null };
}
