import { BottomNav } from "./BottomNav";

/** Standart ekran: bitta skroll maydoni + pastki navigatsiya (o'yin sahifasidan tashqari). */
export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="app-scroll">{children}</div>
      <BottomNav />
    </>
  );
}
