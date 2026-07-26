"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PillTabs, Crest } from "@/components/ui";
import { Screen } from "@/components/Screen";
import type { PlayerStat } from "@/lib/types";

type StatTabId = "top" | "assist" | "golpas";

const statTabs: { id: StatTabId; label: string }[] = [
  { id: "top", label: "To'purarlar" },
  { id: "assist", label: "Assistentlar" },
  { id: "golpas", label: "Gol + Pas" },
];

const rankStyles = [
  { bg: "rgba(233,196,100,0.15)", color: "#E9C464", border: "rgba(233,196,100,0.4)" },
  { bg: "rgba(200,205,215,0.12)", color: "#C8CDD7", border: "rgba(200,205,215,0.3)" },
  { bg: "rgba(205,130,80,0.14)", color: "#CD8250", border: "rgba(205,130,80,0.35)" },
];
const rankDefault = { bg: "rgba(255,255,255,0.05)", color: "rgba(237,244,239,0.6)", border: "rgba(255,255,255,0.1)" };

export function StatistikaClient({ players }: { players: PlayerStat[] }) {
  const [tab, setTab] = useState<StatTabId>("top");

  const rows = useMemo(() => {
    const sorted = [...players].sort((a, b) => {
      if (tab === "top") return b.goals - a.goals;
      if (tab === "assist") return b.assists - a.assists;
      return b.goals + b.assists - (a.goals + a.assists);
    });
    return sorted.slice(0, 5);
  }, [players, tab]);

  return (
    <Screen>
      <div className="flex flex-col gap-4 px-5 pt-3 pb-6">
        <h1 className="text-[22px] font-extrabold tracking-tight">Statistika</h1>

        <PillTabs tabs={statTabs} active={tab} onChange={setTab} />

        <div className="flex flex-col gap-2.5">
          {rows.map((p, i) => {
            const rs = rankStyles[i] ?? rankDefault;
            const value = tab === "top" ? p.goals : tab === "assist" ? p.assists : p.goals + p.assists;
            return (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-[18px] border border-white/[0.07] bg-white/[0.04] px-4 py-3 backdrop-blur transition-all hover:translate-x-1 hover:border-[rgba(47,216,113,0.45)]"
              >
                <div
                  className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-[9px] text-xs font-extrabold"
                  style={{ background: rs.bg, color: rs.color, border: `1px solid ${rs.border}` }}
                >
                  {i + 1}
                </div>
                <Crest gradient={p.team.crest_gradient} init={p.team.init} size={40} fontSize={12} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-bold">{p.player_name}</div>
                  <div className="mt-0.5 text-[10.5px] text-[rgba(237,244,239,0.45)]">{p.team.name}</div>
                </div>
                <div
                  className="text-xl font-extrabold text-[#3BE07C]"
                  style={{ textShadow: "0 0 16px rgba(47,216,113,0.4)" }}
                >
                  {value}
                </div>
              </div>
            );
          })}
        </div>

        <div className="py-1.5 text-center">
          <Link href="/statistika" className="text-[13px] font-bold">
            Barchasi ›
          </Link>
        </div>
      </div>
    </Screen>
  );
}
