import { SkeletonBox, SkeletonList } from "@/components/Skeleton";

/**
 * Barcha yo'nalishlar uchun umumiy yuklanish holati (o'z `loading.tsx` si
 * bo'lgan segmentlar buni almashtiradi). Suspense chegarasi hosil qiladi:
 * navigatsiya bosilishi bilan ekran darhol almashadi, sahifa esa fonda
 * yuklanib bo'lgach o'rniga qo'yiladi.
 */
export default function Loading() {
  return (
    <div className="app-scroll">
      <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "12px 20px 24px" }}>
        <SkeletonBox height={28} width="45%" radius={10} />
        <SkeletonList rows={5} />
      </div>
    </div>
  );
}
