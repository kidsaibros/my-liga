/**
 * Yuklanish paytidagi "suyak" bloklari. `loading.tsx` fayllari shulardan
 * foydalanadi: sahifa serverdan kelguncha foydalanuvchi bo'sh ekran emas,
 * sahifa shaklini ko'radi.
 */
export function SkeletonBox({
  height,
  width = "100%",
  radius = 18,
  style,
}: {
  height: number | string;
  width?: number | string;
  radius?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="skeleton-pulse"
      style={{
        height,
        width,
        borderRadius: radius,
        background: "var(--bg-soft)",
        border: "1px solid var(--border)",
        flex: "none",
        ...style,
      }}
    />
  );
}

/** Bir xil balandlikdagi kartalar ro'yxati (turnirlar, statistika, yangiliklar). */
export function SkeletonList({ rows = 5, height = 72 }: { rows?: number; height?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: rows }, (_, i) => (
        <SkeletonBox key={i} height={height} />
      ))}
    </div>
  );
}
