"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { teamCreateSchema } from "@/lib/validation/schemas";
import { friendlyDbError } from "@/lib/db-error";
import { slugify } from "@/lib/format";
import type { Team } from "@/lib/types";

export type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "??";
}

const DEFAULT_CREST = {
  crest_gradient: "linear-gradient(140deg,#2FD871,#128A48)",
  crest_border: "rgba(255,255,255,0.15)",
  crest_color: "#fff",
};

/** Murabbiy (jamoasi hali yo'q holatda) o'z jamoasini yaratadi — status='pending' bilan boshlanadi. */
export async function createOwnTeam(input: unknown): Promise<ActionResult<Team>> {
  const parsed = teamCreateSchema.safeParse(input);
  if (!parsed.success) return { data: null, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Tizimga kirmagansiz" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, team_id")
    .eq("user_id", user.id)
    .single();
  if (!profile || profile.role !== "coach") return { data: null, error: "Faqat murabbiy jamoa yarata oladi" };
  if (profile.team_id) return { data: null, error: "Sizda allaqachon jamoa mavjud" };

  const baseSlug = slugify(parsed.data.name) || "jamoa";
  const payload = {
    name: parsed.data.name,
    slug: baseSlug,
    init: initialsOf(parsed.data.name),
    logo_url: parsed.data.logo_url ?? null,
    created_by: user.id,
    coach_id: user.id,
    status: "pending" as const,
    ...DEFAULT_CREST,
  };

  let { data: team, error } = await supabase.from("teams").insert(payload).select().single();
  if (error?.code === "23505") {
    // slug band ekan — qisqa tasodifiy qo'shimcha bilan bir marta qayta urinamiz.
    const retry = await supabase
      .from("teams")
      .insert({ ...payload, slug: `${baseSlug}-${Math.random().toString(36).slice(2, 6)}` })
      .select()
      .single();
    team = retry.data;
    error = retry.error;
  }
  if (error) return { data: null, error: friendlyDbError(error.message, error.code) };

  // profiles.team_id — 0009 trigger'i o'z-o'zini yangilashni bloklagani uchun
  // (role/team_id faqat admin/service_role o'zgartira oladi), shu bitta nazorat
  // ostidagi qadam uchun service-role klient ishlatiladi.
  const admin = createAdminClient();
  await admin.from("profiles").update({ team_id: team!.id }).eq("user_id", user.id);

  revalidatePath("/coach");
  revalidatePath("/profil");
  return { data: team as Team, error: null };
}

const MAX_LOGO_BYTES = 5 * 1024 * 1024;

/** Jamoa logotipini 'team-logos' bucket'ga yuklaydi va ochiq URL qaytaradi. */
export async function uploadTeamLogo(formData: FormData): Promise<ActionResult<{ logo_url: string }>> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { data: null, error: "Fayl tanlanmagan" };
  if (!file.type.startsWith("image/")) return { data: null, error: "Faqat rasm fayllari qabul qilinadi" };
  if (file.size > MAX_LOGO_BYTES) return { data: null, error: "Fayl hajmi 5MB dan oshmasligi kerak" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Tizimga kirmagansiz" };

  const folder = user.id;
  const { data: existing } = await supabase.storage.from("team-logos").list(folder);
  if (existing && existing.length > 0) {
    await supabase.storage.from("team-logos").remove(existing.map((f) => `${folder}/${f.name}`));
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${folder}/logo.${ext}`;
  const { error: uploadError } = await supabase.storage.from("team-logos").upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });
  if (uploadError) return { data: null, error: uploadError.message };

  const { data: pub } = supabase.storage.from("team-logos").getPublicUrl(path);
  return { data: { logo_url: `${pub.publicUrl}?t=${Date.now()}` }, error: null };
}
