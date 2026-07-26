"use client";

import { useState } from "react";

const LEAGUES = ["Superliga", "Pro Liga", "Yoshlar ligasi", "Havaskorlar"];

/**
 * Liga-chip qatori — MY LIGA App.dc.html qatorlar 120-124 bilan 1:1.
 * Tanlov hozircha faqat vizual holat (filtrlash yo'q) — yangi dizayn prototipida ham shunday.
 */
export function LeagueChips() {
  const [active, setActive] = useState(LEAGUES[0]);

  return (
    <div
      className="no-scrollbar"
      style={{
        display: "flex",
        flexWrap: "nowrap",
        gap: 8,
        overflowX: "auto",
        margin: "12px -16px 0",
        padding: "0 16px 2px",
      }}
    >
      {LEAGUES.map((league) => {
        const on = league === active;
        return (
          <button
            key={league}
            onClick={() => setActive(league)}
            style={{
              flex: "none",
              border: `1px solid ${on ? "#0E9F6E" : "var(--border)"}`,
              background: on ? "#0E9F6E" : "transparent",
              color: on ? "#fff" : "var(--fg-soft)",
              borderRadius: 99,
              padding: "7px 15px",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
              transition: "all .2s ease",
            }}
          >
            {league}
          </button>
        );
      })}
    </div>
  );
}
