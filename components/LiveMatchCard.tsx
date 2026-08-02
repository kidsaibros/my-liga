"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LiveMinute } from "./LiveMinute";
import type { Match } from "@/lib/types";

/**
 * Bosh sahifadagi jonli o'yin kartasi — hisob REAL VAQTDA yangilanadi.
 * Supabase Realtime orqali shu o'yin `matches` qatoridagi o'zgarishga obuna
 * bo'ladi: admin gol qo'shsa/holatni o'zgartirsa, tomoshabinda hisob refresh'siz
 * o'zgaradi. Jamoa nomlari (join) dastlabki `match`dan olinadi.
 */
export function LiveMatchCard({ match }: { match: Match }) {
  const [m, setM] = useState(match);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`home-match:${match.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches", filter: `id=eq.${match.id}` },
        (payload) => {
          const n = payload.new as Partial<Match>;
          setM((prev) => ({
            ...prev,
            home_score: n.home_score ?? prev.home_score,
            away_score: n.away_score ?? prev.away_score,
            status: n.status ?? prev.status,
            minute: n.minute ?? prev.minute,
            live_started_at: n.live_started_at ?? prev.live_started_at,
          }));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [match.id]);

  // Admin o'yinni to'xtatsa (finished) — bu karta jonlilar orasidan chiqadi.
  if (m.status !== "live") return null;

  return (
    <Link
      href="/oyin"
      style={{
        display: "block",
        background: "var(--card)",
        border: "1px solid rgba(239,68,68,0.35)",
        borderRadius: 18,
        padding: 14,
        textDecoration: "none",
        color: "var(--fg)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: "#EF4444" }}>● JONLI</span>
        <span style={{ fontSize: 11, color: "var(--fg-soft)", fontWeight: 500 }}>{m.venue}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, gap: 8 }}>
        <Crest team={m.home_team} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -1 }}>
            {m.home_score} : {m.away_score}
          </div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "#EF4444" }}>
            <LiveMinute startedAt={m.live_started_at} fallback={m.minute} />
          </div>
        </div>
        <Crest team={m.away_team} />
      </div>
    </Link>
  );
}

function Crest({ team }: { team: Match["home_team"] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 80 }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: team.crest_gradient,
          color: team.crest_color || "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          fontSize: 13,
        }}
      >
        {team.init}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.2, color: "var(--fg)", textAlign: "center" }}>
        {team.name}
      </div>
    </div>
  );
}
