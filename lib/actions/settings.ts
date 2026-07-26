"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { appSettingsSchema } from "@/lib/validation/schemas";
import type { AppSettings } from "@/lib/types";

export type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

const SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

export async function updateAppSettings(input: unknown): Promise<ActionResult<AppSettings>> {
  const parsed = appSettingsSchema.safeParse(input);
  if (!parsed.success) return { data: null, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("app_settings")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", SETTINGS_ID)
    .select()
    .single();
  if (error) return { data: null, error: error.message };

  revalidatePath("/admin");
  revalidatePath("/profil");
  return { data: data as AppSettings, error: null };
}
