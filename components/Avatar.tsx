"use client";

import { useEffect, useState } from "react";

/**
 * Foydalanuvchi avatari — rasm bilan, ishonchli zaxira bilan.
 *
 * NEGA KERAK: ilgari profil sahifasi `<img alt={ism}>` ishlatardi. Google
 * avatar havolasi yuklanmasa (masalan tarmoq/`hosts` bloki yoki eskirgan
 * havola), brauzer rasm o'rniga `alt` matnini — ya'ni to'liq ismni — ko'rsatib,
 * doiradan chiqib ketardi. Endi rasm yuklanmasa, avtomat yashil doira ichida
 * ism bosh harfi ko'rsatiladi.
 */
export function Avatar({
  url,
  name,
  size = 88,
  className = "",
  glow = "0 0 34px rgba(14,159,110,0.25)",
}: {
  url: string | null | undefined;
  name: string;
  size?: number;
  className?: string;
  glow?: string;
}) {
  const [failed, setFailed] = useState(false);

  // Havola o'zgarsa (yangi rasm yuklansa), xato holatini tozalaymiz
  useEffect(() => {
    setFailed(false);
  }, [url]);

  const initial = name.trim().slice(0, 1).toUpperCase() || "?";
  const showImage = url && !failed;

  if (showImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        width={size}
        height={size}
        onError={() => setFailed(true)}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size, border: "1px solid var(--border)", boxShadow: glow }}
      />
    );
  }

  // Zaxira — yashil doira ichida bosh harf
  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center rounded-full font-extrabold ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.36),
        color: "#062016",
        background: "linear-gradient(140deg,#22C55E,#0E9F6E)",
        boxShadow: glow,
      }}
    >
      {initial}
    </div>
  );
}
