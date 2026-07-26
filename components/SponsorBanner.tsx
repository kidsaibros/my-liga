"use client";

import { useEffect, useState } from "react";
import type { Sponsor } from "@/lib/types";

const FALLBACK_BG = "linear-gradient(120deg,#0F4324 0%,#0A2415 55%,#081710 100%)";

/**
 * Faqat http/https havolalarni qabul qilamiz. Zod sxemasi buni allaqachon
 * tekshiradi, lekin bazada validatsiya qo'shilishidan OLDIN saqlangan qatorlar
 * bo'lishi mumkin — `javascript:` havola `href` ga tushsa XSS bo'lardi.
 */
function safeHref(url: string | null): string | null {
  if (!url) return null;
  return /^https?:\/\//i.test(url.trim()) ? url.trim() : null;
}

/** Bosh sahifadagi homiylar banneri — MY LIGA App.dc.html qatorlar 86-102 bilan 1:1. */
export function SponsorBanner({ sponsors }: { sponsors: Sponsor[] }) {
  const [idx, setIdx] = useState(0);
  const slides = sponsors.length > 0 ? sponsors : [];

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(() => setIdx((i) => (i + 1) % slides.length), 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) return null;

  return (
    <div
      style={{
        width: "100%",
        marginTop: 14,
        borderRadius: 18,
        padding: 0,
        background: "#0B1914",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
        height: 118,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          width: "100%",
          transition: "transform .55s cubic-bezier(.4,0,.2,1)",
          transform: `translateX(-${idx * 100}%)`,
        }}
      >
        {slides.map((sp, i) => {
          const active = i === idx;
          const href = safeHref(sp.link_url);

          // Homiy nomi rasm ustiga YOZILMAYDI: logotipning o'zi brendni ko'rsatadi,
          // matn esa uni to'sib qo'yardi. Nom faqat ekran o'quvchilar va hover
          // uchun `aria-label`/`title` da qoladi.
          const content = sp.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sp.logo_url}
              alt={sp.name}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", background: FALLBACK_BG }} />
          );

          const style: React.CSSProperties = {
            flex: "none",
            width: "100%",
            height: 118,
            position: "relative",
            overflow: "hidden",
            display: "block",
          };

          // Havola bo'lsa — butun banner bosiladigan bo'ladi. Yangi oynada
          // ochiladi; `noopener noreferrer` — tashqi sayt `window.opener`
          // orqali ilovaga ta'sir qila olmasligi uchun.
          return href ? (
            <a
              key={sp.id}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={sp.name}
              title={sp.name}
              // Ko'rinmayotgan slaydlarga Tab bilan tushib qolmaslik uchun
              tabIndex={active ? 0 : -1}
              style={style}
            >
              {content}
            </a>
          ) : (
            <div key={sp.id} aria-label={sp.name} title={sp.name} style={style}>
              {content}
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(90deg,rgba(4,12,9,.82) 0%,rgba(4,12,9,.35) 55%,rgba(4,12,9,.1) 100%)",
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "absolute", left: 18, top: 20, textAlign: "left", pointerEvents: "none" }}>
        <div style={{ fontSize: 17, fontWeight: 800 }}>Hamkorlar</div>
        <div style={{ fontSize: 12.5, color: "#A7D8C4", marginTop: 4, fontWeight: 500 }}>Bizning hamkorlarimiz</div>
      </div>
      <div style={{ position: "absolute", left: 18, bottom: 16, display: "flex", gap: 5, pointerEvents: "none" }}>
        {slides.map((sp, i) => (
          <div
            key={sp.id}
            style={{
              height: 5,
              borderRadius: 99,
              transition: "all .3s ease",
              width: i === idx ? 16 : 5,
              background: i === idx ? "#0E9F6E" : "rgba(255,255,255,.35)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
