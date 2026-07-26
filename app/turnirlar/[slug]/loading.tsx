import { SkeletonBox } from "@/components/Skeleton";

/** Turnir tafsilotlari: gradientli header + tablar + jadval shakli. */
export default function Loading() {
  return (
    <div className="app-scroll flex flex-col">
      <div
        className="px-5 pb-5 pt-4"
        style={{ background: "linear-gradient(180deg,#0F4324 0%,#0A2415 60%,#07090A 100%)" }}
      >
        <SkeletonBox height={38} width={38} radius={12} style={{ background: "rgba(255,255,255,0.08)" }} />
        <div className="mt-[18px] flex items-end justify-between gap-4">
          <div className="flex flex-1 flex-col gap-2.5">
            <SkeletonBox height={26} width="70%" radius={8} style={{ background: "rgba(255,255,255,0.08)" }} />
            <SkeletonBox height={12} width="50%" radius={6} style={{ background: "rgba(255,255,255,0.06)" }} />
            <SkeletonBox height={12} width="35%" radius={6} style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>
          <SkeletonBox height={74} width={74} radius={22} style={{ background: "rgba(233,196,100,0.12)" }} />
        </div>
      </div>

      <div className="flex gap-4 border-b border-white/[0.06] px-3.5 py-2.5">
        {[52, 46, 50, 58, 56].map((w, i) => (
          <SkeletonBox key={i} height={11} width={w} radius={5} style={{ background: "rgba(255,255,255,0.06)" }} />
        ))}
      </div>

      <div className="flex flex-col gap-1.5 px-5 pt-[18px]">
        {Array.from({ length: 6 }, (_, i) => (
          <SkeletonBox key={i} height={44} radius={14} style={{ background: "rgba(255,255,255,0.04)" }} />
        ))}
      </div>
    </div>
  );
}
