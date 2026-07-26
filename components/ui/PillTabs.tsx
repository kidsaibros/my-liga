"use client";

/** Pill shaklidagi tablar (Faol / Yakunlangan ...). */
export function PillTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: readonly { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const on = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="cursor-pointer rounded-full px-4 py-2.5 text-xs font-bold transition-all"
            style={{
              background: on ? "linear-gradient(120deg,#22C55E,#0E9F6E)" : "var(--bg-soft)",
              color: on ? "#062016" : "var(--fg-soft)",
              border: `1px solid ${on ? "transparent" : "var(--border)"}`,
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
