"use server";

import { createClient } from "@/lib/supabase/server";

export type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * Umumiy rasm yuklash — `public-images` bucket'iga (0022 migratsiyasi).
 * Homiy logotipi, o'yinchi surati va boshqa ochiq rasmlar uchun.
 *
 * Fayl yo'li: `{userId}/{category}-{timestamp}.{ext}` — RLS foydalanuvchini
 * faqat o'z papkasiga yozishga ruxsat beradi. `category` shunchaki nom uchun
 * (masalan "sponsor", "player"), turli rasmlar bir-birini o'chirmasligi uchun
 * har biri o'z timestamp'i bilan saqlanadi.
 */
export async function uploadPublicImage(formData: FormData): Promise<ActionResult<{ url: string }>> {
  const file = formData.get("file");
  const category = String(formData.get("category") || "image").replace(/[^a-z0-9-]/gi, "") || "image";

  if (!(file instanceof File) || file.size === 0) {
    return { data: null, error: "Fayl tanlanmagan" };
  }
  if (!ALLOWED.includes(file.type)) {
    return { data: null, error: "Faqat JPG, PNG, WEBP yoki GIF rasm qabul qilinadi" };
  }
  if (file.size > MAX_BYTES) {
    return { data: null, error: "Rasm hajmi 5 MB dan oshmasligi kerak" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Tizimga kirmagansiz" };

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${user.id}/${category}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from("public-images").upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });
  if (uploadError) return { data: null, error: uploadError.message };

  const { data: pub } = supabase.storage.from("public-images").getPublicUrl(path);
  return { data: { url: pub.publicUrl }, error: null };
}
