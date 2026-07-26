"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache";
import { createClient } from "@/lib/supabase/server";
import { idSchema, sponsorSchema } from "@/lib/validation/schemas";
import type { Sponsor } from "@/lib/types";

export type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

function revalidateSponsors() {
  revalidatePath("/admin");
  revalidatePath("/");
  revalidateTag(CACHE_TAGS.sponsors, "max");
}

export async function createSponsor(input: unknown): Promise<ActionResult<Sponsor>> {
  const parsed = sponsorSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("sponsors").insert(parsed.data).select().single();
  if (error) return { data: null, error: error.message };

  revalidateSponsors();
  return { data: data as Sponsor, error: null };
}

export async function updateSponsor(id: unknown, input: unknown): Promise<ActionResult<Sponsor>> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { data: null, error: parsedId.error.issues[0].message };

  const parsed = sponsorSchema.safeParse(input);
  if (!parsed.success) return { data: null, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sponsors")
    .update(parsed.data)
    .eq("id", parsedId.data)
    .select()
    .single();
  if (error) return { data: null, error: error.message };

  revalidateSponsors();
  return { data: data as Sponsor, error: null };
}

export async function deleteSponsor(id: unknown): Promise<ActionResult<{ id: string }>> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { data: null, error: parsedId.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.from("sponsors").delete().eq("id", parsedId.data);
  if (error) return { data: null, error: error.message };

  revalidateSponsors();
  return { data: { id: parsedId.data }, error: null };
}
