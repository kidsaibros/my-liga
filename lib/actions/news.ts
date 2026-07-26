"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CACHE_TAGS } from "@/lib/cache";
import { idSchema, newsSchema } from "@/lib/validation/schemas";
import type { News } from "@/lib/types";

export type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

function revalidateNews() {
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/yangiliklar");
  revalidateTag(CACHE_TAGS.news, "max");
}

export async function createNews(input: unknown): Promise<ActionResult<News>> {
  const parsed = newsSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("news").insert(parsed.data).select().single();
  if (error) return { data: null, error: error.message };

  revalidateNews();
  return { data: data as News, error: null };
}

export async function updateNews(id: unknown, input: unknown): Promise<ActionResult<News>> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { data: null, error: parsedId.error.issues[0].message };

  const parsed = newsSchema.safeParse(input);
  if (!parsed.success) return { data: null, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("news")
    .update(parsed.data)
    .eq("id", parsedId.data)
    .select()
    .single();
  if (error) return { data: null, error: error.message };

  revalidateNews();
  return { data: data as News, error: null };
}

export async function deleteNews(id: unknown): Promise<ActionResult<{ id: string }>> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { data: null, error: parsedId.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.from("news").delete().eq("id", parsedId.data);
  if (error) return { data: null, error: error.message };

  revalidateNews();
  return { data: { id: parsedId.data }, error: null };
}
