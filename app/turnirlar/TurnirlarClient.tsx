"use client";

import { useState } from "react";
import Link from "next/link";
import { Screen } from "@/components/Screen";
import { PillTabs } from "@/components/ui";
import { SearchIcon, TrophyIcon } from "@/components/icons";
import type { Tournament, TournamentStatus } from "@/lib/types";

const tourTabs: { id: TournamentStatus; label: string }[] = [
  { id: "faol", label: "Faol" },
  { id: "yakunlangan", label: "Yakunlangan" },
  { id: "kelajakdagi", label: "Kelajakdagi" },
];

export function TurnirlarClient({ tournaments }: { tournaments: Tournament[] }) {
  const [tab, setTab] = useState<TournamentStatus>("faol");
  const list = tournaments.filter((t) => t.status === tab);

  return (
    <Screen>
      <div className="flex flex-col gap-4 px-5 pt-3 pb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-[22px] font-extrabold tracking-tight">Turnirlar</h1>
          <button
            className="flex h-[42px] w-[42px] items-center justify-center rounded-[14px] border transition-all hover:border-[rgba(47,216,113,0.5)]"
            style={{ borderColor: "var(--border)", background: "var(--card)", color: "var(--fg)" }}
          >
            <SearchIcon size={17} />
          </button>
        </div>

        <PillTabs tabs={tourTabs} active={tab} onChange={setTab} />

        <div className="flex flex-col gap-3">
          {list.length === 0 && (
            <div
              className="rounded-[20px] border p-8 text-center text-sm"
              style={{ borderColor: "var(--border)", background: "var(--bg-soft)", color: "var(--fg-muted)" }}
            >
              Bu bo'limda turnirlar yo'q
            </div>
          )}
          {list.map((t) => (
            <Link
              key={t.slug}
              href={`/turnirlar/${t.slug}`}
              className="flex items-center gap-3.5 rounded-[20px] border p-3.5 backdrop-blur transition-all hover:-translate-y-[2px] hover:border-[rgba(47,216,113,0.45)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.2)]"
              style={{ borderColor: "var(--border)", background: "var(--card)" }}
            >
              <div
                className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl text-[#E9C464]"
                style={{
                  background: "linear-gradient(140deg,#3A2E0E,#1C1506)",
                  border: "1px solid rgba(233,196,100,0.35)",
                  boxShadow: "inset 0 0 18px rgba(233,196,100,0.12)",
                }}
              >
                <TrophyIcon size={26} strokeWidth={1.7} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-bold tracking-tight" style={{ color: "var(--fg)" }}>
                  {t.name}
                </div>
                <div className="mt-1 text-[10.5px]" style={{ color: "var(--fg-muted)" }}>
                  Boshlanish sanasi
                </div>
                <div className="mt-px text-[11px] font-semibold" style={{ color: "var(--fg-soft)" }}>
                  {t.dates_label}
                </div>
                <div className="mt-1.5 text-[10.5px] font-semibold" style={{ color: "#0E9F6E" }}>
                  {t.team_count} ta jamoa
                </div>
              </div>
              <div
                className="self-end rounded-[10px] px-3.5 py-2 text-[11px] font-extrabold text-[#06130B]"
                style={{
                  background: "linear-gradient(140deg,#2FD871,#128A48)",
                  boxShadow: "0 0 16px rgba(47,216,113,0.25)",
                }}
              >
                Batafsil
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Screen>
  );
}
