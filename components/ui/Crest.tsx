"use client";

/** Jamoa gerbi — gradientli dumaloq nishon. */
export function Crest({
  gradient,
  init,
  size = 36,
  fontSize = 11,
  border = "rgba(255,255,255,0.15)",
  color = "#fff",
  glow,
}: {
  gradient: string;
  init: string;
  size?: number;
  fontSize?: number;
  border?: string;
  color?: string;
  glow?: string;
}) {
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-full font-extrabold"
      style={{
        width: size,
        height: size,
        fontSize,
        color,
        background: gradient,
        border: `1px solid ${border}`,
        boxShadow: glow,
      }}
    >
      {init}
    </div>
  );
}
