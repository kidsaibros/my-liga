import Link from "next/link";
import { Screen } from "@/components/Screen";
import { SponsorBanner } from "@/components/SponsorBanner";
import { LeagueChips } from "@/components/LeagueChips";
import { getHomeData } from "@/lib/cache";
import { formatMatchDateTime } from "@/lib/format";
import { getSessionProfile } from "@/lib/auth";
import { Avatar } from "@/components/Avatar";
import type { Match } from "@/lib/types";

/** Bosh sahifa — MY LIGA App.dc.html "HOME" bloki bilan 1:1 (qatorlar 65-125). */
export default async function HomePage() {
  // Ochiq ma'lumot keshdan, foydalanuvchi profili esa har so'rovda yangi.
  const [home, profile] = await Promise.all([getHomeData(), getSessionProfile()]);

  const homeMatches = home.matches;
  const activeTournaments = home.activeTournaments;
  const sponsors = home.sponsors;
  const greetName = profile?.fullName ?? "Mehmon";

  return (
    <Screen>
      <div style={{ padding: "8px 16px 0", animation: "fadein .25s ease" }}>
        {/* Salomlashish */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            paddingBottom: 14,
            marginBottom: 2,
            borderBottom: "1px solid var(--border)",
          }}
        >
          <Avatar url={profile?.avatarUrl} name={greetName} size={46} glow="none" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: "var(--fg-soft)", fontWeight: 500 }}>Salom,</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{greetName}!</div>
          </div>
          <Link
            href="/yangiliklar"
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              background: "var(--card)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--fg)",
              position: "relative",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
              <path d="M10.5 20a1.7 1.7 0 0 0 3 0" />
            </svg>
            <div style={{ position: "absolute", margin: "-16px 0 0 16px", width: 8, height: 8, borderRadius: "50%", background: "#EF4444" }} />
          </Link>
        </div>

        {/* Tezkor kartalar */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 16 }}>
          <Link
            href="/turnirlar"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 18,
              padding: "16px 10px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 9,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <div style={{ height: 38, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg)" }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2H6v1H2v4a4 4 0 0 0 4 4h.3A6 6 0 0 0 11 14.9V17H8a1 1 0 0 0 0 2h1v1H7a1 1 0 0 0 0 2h10a1 1 0 0 0 0-2h-2v-1h1a1 1 0 0 0 0-2h-3v-2.1A6 6 0 0 0 17.7 11H18a4 4 0 0 0 4-4V3h-4zM6 9a2 2 0 0 1-2-2V5h2zm14-2a2 2 0 0 1-2 2V5h2z" />
              </svg>
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--fg)" }}>Turnirlar</div>
            <div style={{ fontSize: 11, color: "var(--fg-soft)", fontWeight: 500 }}>{activeTournaments} ta faol</div>
          </Link>

          <Link
            href="/turnirlar"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 18,
              padding: "16px 10px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 9,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <div style={{ height: 38, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg)" }}>
              <svg width="34" height="34" viewBox="0 0 24 24">
                <path d="M12 2l8 3v6c0 4.7-3.4 8-8 9.5C7.6 19 4 15.7 4 11V5z" fill="#065F46" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M12 7.5l1.3 2.6 2.9.4-2.1 2 .5 2.9-2.6-1.4-2.6 1.4.5-2.9-2.1-2 2.9-.4z" fill="#fff" />
              </svg>
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--fg)" }}>Ligalar</div>
            <div style={{ fontSize: 11, color: "var(--fg-soft)", fontWeight: 500 }}>8 ta faol</div>
          </Link>

          <Link
            href="/yangiliklar"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 18,
              padding: "16px 10px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 9,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <div style={{ height: 38, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg)" }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 4h14a1 1 0 0 1 1 1v13a2 2 0 0 0 2-2V8h-1V6h2a1 1 0 0 1 1 1v9a4 4 0 0 1-4 4H5a2 2 0 0 1-2-2zm3 4h8v2H6zm0 4h8v2H6zm0 4h5v2H6z" />
              </svg>
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--fg)" }}>Yangiliklar</div>
            <div style={{ fontSize: 11, color: "var(--fg-soft)", fontWeight: 500 }}>So&apos;nggi yangiliklar</div>
          </Link>
        </div>

        {/* Homiylar banneri */}
        <SponsorBanner sponsors={sponsors} />

        {/* Yaqin o'yinlar */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", margin: "20px 2px 10px" }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>Yaqin o&apos;yinlar</div>
          <Link href="/oyin" style={{ border: 0, background: "none", color: "#0E9F6E", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            Barchasi ›
          </Link>
        </div>
        <div
          className="no-scrollbar"
          style={{
            display: "flex",
            flexWrap: "nowrap",
            gap: 10,
            overflowX: "auto",
            margin: "0 -16px",
            padding: "0 16px 6px",
          }}
        >
          {homeMatches.length === 0 ? (
            <div
              style={{
                flex: "none",
                width: "100%",
                borderRadius: 18,
                border: "1px solid var(--border)",
                background: "var(--bg-soft)",
                padding: 24,
                textAlign: "center",
                fontSize: 13,
                color: "var(--fg-muted)",
              }}
            >
              Hozircha rejalashtirilgan o&apos;yinlar yo&apos;q
            </div>
          ) : (
            homeMatches.map((m) => (
              <Link
                key={m.id}
                href="/oyin"
                style={{
                  flex: "none",
                  width: 250,
                  scrollSnapAlign: "start",
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 18,
                  padding: 14,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 11.5, color: "var(--fg-soft)", fontWeight: 600 }}>{formatMatchDateTime(m.kickoff_at)}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, gap: 8 }}>
                  <TeamMini team={m.home_team} />
                  <div style={{ fontSize: 12, fontWeight: 800, color: "var(--fg-muted)" }}>VS</div>
                  <TeamMini team={m.away_team} />
                </div>
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)", fontSize: 11, color: "var(--fg-soft)", fontWeight: 500 }}>
                  {m.venue}
                </div>
              </Link>
            ))
          )}
        </div>

        <LeagueChips />
      </div>
    </Screen>
  );
}

function TeamMini({ team }: { team: Match["home_team"] }) {
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
      <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.2, color: "var(--fg)" }}>{team.name}</div>
    </div>
  );
}
