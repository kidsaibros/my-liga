"use client";

import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "danger";

const variantStyle: Record<Variant, React.CSSProperties> = {
  primary: {
    background: "linear-gradient(120deg,#22C55E,#0E9F6E)",
    color: "#062016",
    boxShadow: "0 10px 24px rgba(14,159,110,0.28)",
  },
  ghost: {
    background: "var(--bg-soft)",
    color: "var(--fg)",
    border: "1px solid var(--border)",
  },
  danger: {
    background: "rgba(239,68,68,0.1)",
    color: "#F87171",
    border: "1px solid rgba(239,68,68,0.22)",
  },
};

/** Asosiy CTA tugmasi — saqlanayotganda spinner ko'rsatadi. */
export function Button({
  variant = "primary",
  loading = false,
  loadingLabel = "Saqlanmoqda...",
  children,
  className = "",
  style,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
  loadingLabel?: string;
}) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-[13px] border-0 px-4 py-3.5 text-sm font-extrabold transition-opacity disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
      style={{ ...variantStyle[variant], ...style }}
    >
      {loading && (
        <span
          className="h-4 w-4 flex-none animate-spin rounded-full border-[2.5px] border-current"
          style={{ borderTopColor: "transparent", opacity: 0.9 }}
        />
      )}
      {loading ? loadingLabel : children}
    </button>
  );
}
