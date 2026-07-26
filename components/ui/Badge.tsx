"use client";

type Tone = "emerald" | "gold" | "gray" | "blue" | "red";

const toneColor: Record<Tone, string> = {
  emerald: "14,159,110",
  gold: "245,194,75",
  gray: "156,163,175",
  blue: "59,130,246",
  red: "239,68,68",
};

/** Bo'yalgan-fon/to'q-matn/bo'yalgan-chegara pill — status, featured, kategoriya belgilari uchun. */
export function Badge({
  tone = "gray",
  children,
  className = "",
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  const rgb = toneColor[tone];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${className}`}
      style={{
        background: `rgba(${rgb},0.12)`,
        color: `rgb(${rgb})`,
        border: `1px solid rgba(${rgb},0.3)`,
      }}
    >
      {children}
    </span>
  );
}
