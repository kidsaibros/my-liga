"use client";

import { XIcon } from "@/components/icons";

/** Qayta ishlatiladigan pastdan chiquvchi panel — mavjud AdminSheet/CoachSheet uslubi bilan bir xil. */
export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-t-[28px] p-5 sm:rounded-[28px]"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between">
          <h1 className="text-[16px] font-extrabold tracking-tight">{title}</h1>
          <button
            onClick={onClose}
            aria-label="Yopish"
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ background: "var(--bg-soft)", color: "var(--fg)" }}
          >
            <XIcon size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
