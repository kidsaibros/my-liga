"use client";

import { useEffect, useState } from "react";
import type { Sponsor } from "@/lib/types";

const FALLBACK_BG = "linear-gradient(120deg,#0F4324 0%,#0A2415 55%,#081710 100%)";

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
        {slides.map((sp) => (
          <div
            key={sp.id}
            style={{
              flex: "none",
              width: "100%",
              height: 118,
              position: "relative",
              background: sp.logo_url ? `url(${sp.logo_url})` : FALLBACK_BG,
              backgroundSize: "cover",
              backgroundPosition: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 800,
              fontSize: 18,
              letterSpacing: 0.5,
            }}
          >
            {sp.name}
          </div>
        ))}
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
