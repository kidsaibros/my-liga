"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { coachInviteSchema, idSchema } from "@/lib/validation/schemas";
import { friendlyDbError } from "@/lib/db-error";
import type { CoachInvite } from "@/lib/types";

export type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

/** Super Admin: hali ro'yxatdan o'tmagan bo'lg'usi murabbiyni email orqali (jamoasiz) taklif qiladi. */
export async function inviteCoach(input: unknown): Promise<ActionResult<CoachInvite>> {
  const parsed = coachInviteSchema.safeParse(input);
  if (!parsed.success) return { data: null, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("coach_invites")
    .insert({ email: parsed.data.email, invited_by: user?.id ?? null })
    .select()
    .single();
  if (error) return { data: null, error: friendlyDbError(error.message, error.code) };

  revalidatePath("/admin");
  return { data: data as CoachInvite, error: null };
}

export async function cancelCoachInvite(id: unknown): Promise<ActionResult<{ id: string }>> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { data: null, error: parsedId.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.from("coach_invites").delete().eq("id", parsedId.data);
  if (error) return { data: null, error: friendlyDbError(error.message, error.code) };

  revalidatePath("/admin");
  return { data: { id: parsedId.data }, error: null };
}
