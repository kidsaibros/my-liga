"use client";

import { useEffect } from "react";

/**
 * Sahifa darajasidagi xato chegarasi. Server Component render paytida yoki
 * client komponentda tutilmagan xato yuz berganda shu ko'rsatiladi — Next.js'ning
 * inglizcha standart sahifasi o'rniga.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Production'da xato konsolda qoladi — keyinchalik Sentry kabi xizmatga
    // ulash uchun aynan shu joy.
    console.error("Sahifa xatosi:", error);
  }, [error]);

  return (
    <div className="app-scroll flex flex-1 flex-col items-center justify-center px-8 text-center">
      <div
        className="flex h-[72px] w-[72px] items-center justify-center rounded-[24px]"
        style={{
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

      <h1 className="mt-5 text-[19px] font-extrabold tracking-tight">Nimadir noto&apos;g&apos;ri ketdi</h1>
      <p className="mt-2 max-w-[300px] text-[13px] leading-relaxed" style={{ color: "var(--fg-soft)" }}>
        Sahifani yuklashda kutilmagan xato yuz berdi. Qayta urinib ko&apos;ring — muammo
        takrorlansa, biroz kutib qayta kiring.
      </p>

      {error.digest && (
        <p className="mt-3 text-[10.5px]" style={{ color: "var(--fg-muted)" }}>
          Xato kodi: {error.digest}
        </p>
      )}

      <div className="mt-6 flex w-full max-w-[280px] flex-col gap-2.5">
        <button
          onClick={reset}
          className="w-full rounded-[13px] border-0 px-4 py-3 text-[13px] font-extrabold text-[#062016]"
          style={{ background: "linear-gradient(120deg,#22C55E,#0E9F6E)" }}
        >
          Qayta urinish
        </button>
        <a
          href="/"
          className="w-full rounded-[13px] border px-4 py-3 text-[13px] font-semibold"
          style={{ background: "var(--bg-soft)", borderColor: "var(--border)", color: "var(--fg)" }}
        >
          Bosh sahifaga qaytish
        </a>
      </div>
    </div>
  );
}
