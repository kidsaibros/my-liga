"use client";

import type { ButtonHTMLAttributes } from "react";

type Tone = "neutral" | "danger";

const toneStyle: Record<Tone, React.CSSProperties> = {
  neutral: {
    background: "var(--bg-soft)",
    border: "1px solid var(--border)",
    color: "var(--fg-soft)",
  },
  danger: {
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.22)",
    color: "#F87171",
  },
};

/** 32x32 kvadrat amal tugmasi — tahrirlash/o'chirish uchun. */
export function IconButton({
  tone = "neutral",
  children,
  className = "",
  style,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone }) {
  return (
    <button
      {...props}
      className={`flex h-8 w-8 flex-none cursor-pointer items-center justify-center rounded-[9px] transition-opacity hover:opacity-80 ${className}`}
      style={{ ...toneStyle[tone], ...style }}
    >
      {children}
    </button>
  );
}
