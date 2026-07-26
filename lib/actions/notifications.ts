"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { idSchema } from "@/lib/validation/schemas";

export type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

export async function markNotificationRead(id: unknown): Promise<ActionResult<{ id: string }>> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { data: null, error: parsedId.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.from("notifications").update({ read: true }).eq("id", parsedId.data);
  if (error) return { data: null, error: error.message };

  revalidatePath("/admin");
  return { data: { id: parsedId.data }, error: null };
}
