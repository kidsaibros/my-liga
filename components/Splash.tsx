"use client";

import { useEffect, useState } from "react";

const SPLASH_KEY = "ml_splash_shown";
const STADIUM_BG =
  "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80";

/** Kirish ekrani — MY LIGA App.dc.html bilan 1:1. Sessiyada bir marta, 2.4s dan keyin yoki bosilganda yopiladi. */
export function Splash() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SPLASH_KEY)) return;
    setVisible(true);
    const timer = setTimeout(dismiss, 2400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function dismiss() {
    sessionStorage.setItem(SPLASH_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      onClick={dismiss}
      style={{
        // BottomNav (z-index:10) kabi butun app-frame'ni to'liq qoplaydigan overlay —
        // flex-sibling emas, aks holda kontent bilan balandlikni bo'lishib olardi.
        position: "absolute",
        inset: 0,
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        backgroundImage: `url('${STADIUM_BG}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "#062c1e",
      }}
    >
      {/* Rasm ustidagi qoraytirish qatlami — fon ko'rinib turishi uchun multiply emas, oddiy gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(4,20,14,0.55) 0%, rgba(2,12,8,0.8) 100%)",
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 16,
          animation: "fadein .6s ease both",
          filter: "drop-shadow(0 12px 34px rgba(4,20,14,.65))",
        }}
      >
        <div
          style={{
            fontStyle: "italic",
            fontWeight: 800,
            fontSize: 76,
            lineHeight: 0.92,
            letterSpacing: -2,
            textShadow: "0 2px 18px rgba(4,20,14,.6)",
          }}
        >
          <div style={{ color: "#fff" }}>MY</div>
          <div style={{ color: "#fff" }}>LIGA</div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.svg"
          alt="MY LIGA"
          width={96}
          height={96}
          style={{ flex: "none", filter: "drop-shadow(0 10px 26px rgba(4,20,14,.55))" }}
        />
      </div>
      <div
        style={{
          position: "relative",
          marginTop: 10,
          height: 5,
          width: 150,
          borderRadius: 99,
          background: "linear-gradient(90deg, transparent, #0E9F6E 30%, #0E9F6E 70%, transparent)",
          animation: "fadein .6s .1s ease both",
        }}
      />
      <div
        style={{
          position: "relative",
          marginTop: 16,
          color: "#DDF2E7",
          fontSize: 15,
          fontWeight: 600,
          textShadow: "0 1px 8px rgba(4,20,14,.7)",
          animation: "fadein .6s .15s ease both",
        }}
      >
        Har bir o&apos;yin – bir tarix!
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 72,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ color: "#DDF2E7", fontSize: 12, fontWeight: 600 }}>Yuklanmoqda...</div>
        <div style={{ width: 150, height: 4, borderRadius: 99, background: "rgba(255,255,255,.2)", overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 99, background: "#0E9F6E", animation: "loadbar 2.2s ease forwards" }} />
        </div>
      </div>
    </div>
  );
}
