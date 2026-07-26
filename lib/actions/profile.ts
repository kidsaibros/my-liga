"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileNameSchema } from "@/lib/validation/schemas";

export type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function updateFullName(fullName: unknown): Promise<ActionResult<{ full_name: string }>> {
  const parsed = profileNameSchema.safeParse(fullName);
  if (!parsed.success) return { data: null, error: parsed.error.issues[0].message };

  const { supabase, user } = await requireUser();
  if (!user) return { data: null, error: "Tizimga kirmagansiz" };

  const { error } = await supabase.from("profiles").update({ full_name: parsed.data }).eq("user_id", user.id);
  if (error) return { data: null, error: error.message };

  revalidatePath("/profil");
  revalidatePath("/");
  return { data: { full_name: parsed.data }, error: null };
}

export async function updateNotificationPrefs(
  push: boolean,
  email: boolean
): Promise<ActionResult<{ push: boolean; email: boolean }>> {
  const { supabase, user } = await requireUser();
  if (!user) return { data: null, error: "Tizimga kirmagansiz" };

  const { error } = await supabase
    .from("profiles")
    .update({ push_enabled: push, email_enabled: email })
    .eq("user_id", user.id);
  if (error) return { data: null, error: error.message };

  revalidatePath("/profil");
  return { data: { push, email }, error: null };
}

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export async function uploadAvatar(formData: FormData): Promise<ActionResult<{ avatar_url: string }>> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { data: null, error: "Fayl tanlanmagan" };
  if (!file.type.startsWith("image/")) return { data: null, error: "Faqat rasm fayllari qabul qilinadi" };
  if (file.size > MAX_AVATAR_BYTES) return { data: null, error: "Fayl hajmi 5MB dan oshmasligi kerak" };

  const { supabase, user } = await requireUser();
  if (!user) return { data: null, error: "Tizimga kirmagansiz" };

  const folder = user.id;

  // Eski avatar fayl(lar)ini o'chirib, kengaytma o'zgargan taqdirda ham to'liq almashtiriladi.
  const { data: existing } = await supabase.storage.from("avatars").list(folder);
  if (existing && existing.length > 0) {
    await supabase.storage.from("avatars").remove(existing.map((f) => `${folder}/${f.name}`));
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${folder}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });
  if (uploadError) return { data: null, error: uploadError.message };

  const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
  const avatarUrl = `${pub.publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("user_id", user.id);
  if (updateError) return { data: null, error: updateError.message };

  revalidatePath("/profil");
  revalidatePath("/");
  return { data: { avatar_url: avatarUrl }, error: null };
}
