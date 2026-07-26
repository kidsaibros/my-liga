"use client";

import { useEffect } from "react";

/** Server Action natijasidan keyin qisqa muddatli xabar (muvaffaqiyat/xato). */
export function Toast({
  message,
  kind = "success",
  onDone,
}: {
  message: string;
  kind?: "success" | "error";
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className="animate-fade-up fixed left-1/2 top-4 z-[90] -translate-x-1/2 rounded-full border px-4 py-2.5 text-[12px] font-semibold backdrop-blur-xl"
      style={{
        background: kind === "success" ? "rgba(47,216,113,0.15)" : "rgba(220,90,90,0.15)",
        borderColor: kind === "success" ? "rgba(47,216,113,0.4)" : "rgba(220,90,90,0.4)",
        color: kind === "success" ? "#7CF0AC" : "#E8A0A0",
      }}
    >
      {message}
    </div>
  );
}
