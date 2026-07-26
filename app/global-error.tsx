"use client";

import { useEffect } from "react";

/**
 * Eng tashqi xato chegarasi — root layout'ning O'ZI yiqilganda ishlaydi
 * (masalan `getSessionProfile()` kutilmagan xato bersa). `app/error.tsx` dan
 * farqi: bu yerda layout mavjud emas, shuning uchun `<html>` va `<body>` ni
 * o'zi chizadi va CSS o'zgaruvchilariga tayanmaydi.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global xato:", error);
  }, [error]);

  return (
    <html lang="uz">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A0E0B",
          color: "#EDF4EF",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 340, textAlign: "center" }}>
          <div
            style={{
              width: 72,
              height: 72,
              margin: "0 auto",
              borderRadius: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(232,72,72,0.1)",
              border: "1px solid rgba(232,72,72,0.35)",
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F58080" strokeWidth="1.8" strokeLinecap="round">
              <path d="M12 8v5" />
              <circle cx="12" cy="16.5" r="0.6" fill="#F58080" />
              <path d="M10.3 3.9 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0z" />
            </svg>
          </div>

          <h1 style={{ fontSize: 19, fontWeight: 800, marginTop: 20, marginBottom: 8 }}>
            Ilovada jiddiy xato
          </h1>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: "rgba(237,244,239,0.7)", margin: 0 }}>
            Ilovani yuklab bo&apos;lmadi. Sahifani yangilab ko&apos;ring.
          </p>

          {error.digest && (
            <p style={{ fontSize: 10.5, color: "rgba(237,244,239,0.45)", marginTop: 12 }}>
              Xato kodi: {error.digest}
            </p>
          )}

          <button
            onClick={reset}
            style={{
              marginTop: 24,
              width: "100%",
              border: 0,
              borderRadius: 13,
              padding: "13px 16px",
              fontSize: 13,
              fontWeight: 800,
              color: "#062016",
              background: "linear-gradient(120deg,#22C55E,#0E9F6E)",
              cursor: "pointer",
            }}
          >
            Qayta urinish
          </button>
        </div>
      </body>
    </html>
  );
}
