"use client";

import { useRef, useState } from "react";
import { uploadPublicImage } from "@/lib/actions/upload";
import { CameraIcon, XIcon } from "@/components/icons";

/**
 * Qayta ishlatiladigan rasm yuklash komponenti.
 *
 * Foydalanuvchi telefonidan/kompyuteridan rasm tanlaydi → `public-images`
 * bucket'iga yuklanadi (0022) → tayyor URL `onChange` orqali qaytariladi.
 * Katta fayl yoki noto'g'ri format uchun chiroyli o'zbekcha xato ko'rsatadi.
 *
 * URL kiritish maydonining o'rniga ishlatiladi — foydalanuvchi endi URL
 * qidirmaydi, to'g'ridan-to'g'ri rasm tanlaydi.
 */
export function ImageUpload({
  value,
  onChange,
  category,
  label,
  shape = "rect",
  hint,
}: {
  value: string | null;
  onChange: (url: string) => void;
  /** Fayl nomida ishlatiladi, masalan "sponsor" yoki "player" */
  category: string;
  label?: string;
  /** "circle" — dumaloq avatar (o'yinchi), "rect" — to'rtburchak (banner/logo) */
  shape?: "circle" | "rect";
  hint?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Bir xil faylni qayta tanlash ham hodisani ishga tushirishi uchun tozalaymiz
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("category", category);

    const result = await uploadPublicImage(fd);
    setUploading(false);

    if (result.error !== null) {
      setError(result.error);
      return;
    }
    onChange(result.data.url);
  }

  const rounded = shape === "circle" ? "rounded-full" : "rounded-[14px]";
  const box = shape === "circle" ? "h-20 w-20" : "h-28 w-full";

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span className="text-[10.5px] font-semibold" style={{ color: "var(--fg-soft, rgba(237,244,239,0.5))" }}>
          {label}
        </span>
      )}

      <div className={`relative ${shape === "circle" ? "self-start" : ""}`}>
        {value ? (
          <div className={`relative overflow-hidden ${rounded} ${box}`} style={{ border: "1px solid var(--border, rgba(255,255,255,0.1))" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="h-full w-full object-cover" />
            {/* Rasmni o'chirish */}
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="Rasmni olib tashlash"
              className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur"
            >
              <XIcon size={13} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className={`flex ${box} ${rounded} flex-col items-center justify-center gap-1.5 border border-dashed disabled:opacity-60`}
            style={{ borderColor: "rgba(47,216,113,0.4)", background: "rgba(47,216,113,0.05)", color: "#3BE07C" }}
          >
            <CameraIcon size={20} />
            <span className="text-[11px] font-semibold">{uploading ? "Yuklanmoqda..." : "Rasm tanlash"}</span>
          </button>
        )}

        {/* Rasm bor bo'lganda ham almashtirish tugmasi */}
        {value && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            aria-label="Rasmni almashtirish"
            className={`absolute flex h-8 w-8 items-center justify-center rounded-full border-2 disabled:opacity-60 ${
              shape === "circle" ? "-bottom-1 -right-1" : "bottom-2 right-2"
            }`}
            style={{ background: "#0E9F6E", color: "#fff", borderColor: "var(--card, #0B0F0C)" }}
          >
            <CameraIcon size={14} />
          </button>
        )}

        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handlePick} />
      </div>

      {error ? (
        <span className="text-[11px] text-[#F87171]">{error}</span>
      ) : hint ? (
        <span className="text-[10.5px]" style={{ color: "var(--fg-muted, rgba(237,244,239,0.4))" }}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}
