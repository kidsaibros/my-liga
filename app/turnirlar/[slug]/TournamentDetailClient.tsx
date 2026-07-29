"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { Crest } from "@/components/ui";
import { BackIcon, ShareIcon, CalendarIcon, ClockIcon, TrophyIcon, PinIcon } from "@/components/icons";
import { formatMatchDateTime } from "@/lib/format";
import type { Match, Scorer, Standing, Tournament } from "@/lib/types";

const tabs = ["Jadval", "O'yinlar", "Natijalar", "To'purarlar", "Reglament"] as const;
type TabId = (typeof tabs)[number];

const cols = "24px 1fr 26px 26px 26px 26px 40px 32px";

const muted = "var(--fg-muted)";
const soft = "var(--fg-soft)";

/** Bo'sh holat uchun bir xil ko'rinishdagi karta. */
function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[18px] border border-[var(--border)] bg-[var(--card)] p-6 text-center text-sm" style={{ color: muted }}>
      {children}
    </div>
  );
}

/** «O'yinlar» tabidagi bo'lib o'tmagan uchrashuv kartasi. */
function FixtureCard({ match }: { match: Match }) {
  const isLive = match.status === "live";
  return (
    <div
      className="rounded-[18px] border p-3.5 transition-all hover:border-[rgba(47,216,113,0.45)]"
      style={{
        borderColor: isLive ? "rgba(47,216,113,0.35)" : "var(--border)",
        background: isLive ? "rgba(47,216,113,0.06)" : "var(--bg-soft)",
      }}
    >
      <div className="flex items-center justify-between text-[10.5px]" style={{ color: muted }}>
        <span className="flex items-center gap-1.5">
          <CalendarIcon size={12} />
          {formatMatchDateTime(match.kickoff_at)}
        </span>
        {isLive ? (
          <span className="flex items-center gap-1 font-extrabold text-[#3BE07C]">
            <span className="h-[6px] w-[6px] animate-pulse rounded-full bg-[#3BE07C]" />
            JONLI {match.minute ? `${match.minute}'` : ""}
          </span>
        ) : match.group_name ? (
          <span className="font-semibold">Guruh {match.group_name}</span>
        ) : null}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Crest gradient={match.home_team.crest_gradient} init={match.home_team.init} size={30} fontSize={9.5} />
          <span className="truncate text-[12.5px] font-bold">{match.home_team.name}</span>
        </div>

        <div className="flex-none px-2 text-center">
          {isLive ? (
            <div className="text-[17px] font-extrabold text-[#3BE07C]">
              {match.home_score} : {match.away_score}
            </div>
          ) : (
            <div className="text-[11px] font-extrabold" style={{ color: muted }}>
              VS
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <span className="truncate text-right text-[12.5px] font-bold">{match.away_team.name}</span>
          <Crest gradient={match.away_team.crest_gradient} init={match.away_team.init} size={30} fontSize={9.5} />
        </div>
      </div>

      {match.venue && (
        <div className="mt-3 flex items-center gap-1.5 border-t border-[var(--border)] pt-2.5 text-[10.5px]" style={{ color: muted }}>
          <PinIcon size={12} />
          {match.venue}
        </div>
      )}
    </div>
  );
}

/** «Natijalar» tabidagi yakunlangan uchrashuv qatori — g'olib qalin ko'rsatiladi. */
function ResultRow({ match }: { match: Match }) {
  const homeWon = match.home_score > match.away_score;
  const awayWon = match.away_score > match.home_score;

  return (
    <div className="rounded-[16px] border border-[var(--border)] bg-[var(--card)] px-3.5 py-3 transition-all hover:border-[rgba(47,216,113,0.35)]">
      <div className="mb-2.5 text-[10px]" style={{ color: muted }}>
        {formatMatchDateTime(match.kickoff_at)}
        {match.group_name ? ` · Guruh ${match.group_name}` : ""}
      </div>

      <div className="flex items-center gap-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Crest gradient={match.home_team.crest_gradient} init={match.home_team.init} size={26} fontSize={8.5} />
          <span className="truncate text-[12px]" style={{ fontWeight: homeWon ? 800 : 500, color: homeWon ? "var(--fg)" : soft }}>
            {match.home_team.name}
          </span>
        </div>

        <div className="flex flex-none items-center gap-1.5 rounded-[10px] bg-[var(--card)] px-2.5 py-1 text-[13px] font-extrabold">
          <span style={{ color: homeWon ? "#3BE07C" : soft }}>{match.home_score}</span>
          <span style={{ color: muted }}>:</span>
          <span style={{ color: awayWon ? "#3BE07C" : soft }}>{match.away_score}</span>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <span className="truncate text-right text-[12px]" style={{ fontWeight: awayWon ? 800 : 500, color: awayWon ? "var(--fg)" : soft }}>
            {match.away_team.name}
          </span>
          <Crest gradient={match.away_team.crest_gradient} init={match.away_team.init} size={26} fontSize={8.5} />
        </div>
      </div>
    </div>
  );
}

const rankStyles = [
  { bg: "rgba(233,196,100,0.15)", color: "#E9C464", border: "rgba(233,196,100,0.4)" },
  { bg: "rgba(200,205,215,0.12)", color: "#C8CDD7", border: "rgba(200,205,215,0.3)" },
  { bg: "rgba(205,130,80,0.14)", color: "#CD8250", border: "rgba(205,130,80,0.35)" },
];
const rankDefault = { bg: "var(--card)", color: soft, border: "var(--border)" };

export function TournamentDetailClient({
  tournament,
  standings,
  upcoming,
  results,
  scorers,
}: {
  tournament: Tournament;
  standings: Standing[];
  upcoming: Match[];
  results: Match[];
  scorers: Scorer[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("Jadval");
  const [shared, setShared] = useState(false);

  // Turnirni ulashish: telefonda tizim ulashish oynasi, aks holda havolani nusxalash.
  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const shareData = { title: tournament.name, text: `${tournament.name} — MY LIGA`, url };
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(shareData);
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 1800);
      }
    } catch {
      // Foydalanuvchi ulashishni bekor qildi — hech narsa qilmaymiz.
    }
  }

  // Hozir ketayotgan o'yin «kelgusi» emas — uni alohida bo'limga ajratamiz.
  const live = useMemo(() => upcoming.filter((m) => m.status === "live"), [upcoming]);
  const scheduled = useMemo(() => upcoming.filter((m) => m.status !== "live"), [upcoming]);

  // Golsiz o'yinchilarni ro'yxatdan chiqarib, eng ko'p gol urganlarni tartiblaymiz.
  const topScorers = useMemo(
    () =>
      scorers
        .filter((p) => p.goals > 0)
        .sort((a, b) => b.goals - a.goals || b.assists - a.assists || a.player_name.localeCompare(b.player_name))
        .slice(0, 10),
    [scorers]
  );

  // Reglament — har bir bo'sh bo'lmagan qator alohida band.
  const regulationItems = useMemo(
    () =>
      (tournament.regulations ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    [tournament.regulations]
  );

  return (
    <>
      <div className="app-scroll flex flex-col">
        {/* Gradientli header */}
        <div
          className="relative overflow-hidden px-5 pb-5 pt-4"
          style={{ background: "linear-gradient(180deg,#0F4324 0%,#0A2415 60%,#07090A 100%)" }}
        >
          <div
            className="pointer-events-none absolute -right-5 top-5 h-52 w-52 rounded-full"
            style={{
              background: "radial-gradient(circle,rgba(233,196,100,0.18),transparent 65%)",
              animation: "glowDrift 5s ease-in-out infinite",
            }}
          />
          <div className="relative flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-white/[0.08] text-[#EDF4EF] transition hover:bg-white/[0.16]"
            >
              <BackIcon size={16} />
            </button>
            <button
              type="button"
              onClick={handleShare}
              aria-label="Ulashish"
              className="relative flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-white/[0.08] text-[#EDF4EF] transition hover:bg-white/[0.16]"
            >
              <ShareIcon size={16} />
              {shared && (
                <span
                  className="absolute right-0 top-[44px] whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-semibold"
                  style={{ background: "#0E9F6E", color: "#fff" }}
                >
                  Havola nusxalandi
                </span>
              )}
            </button>
          </div>
          <div className="relative mt-[18px] flex items-end justify-between">
            <div>
              <div className="text-2xl font-extrabold tracking-tight">{tournament.name}</div>
              <div className="mt-2.5 flex items-center gap-1.5 text-[11.5px] text-[rgba(237,244,239,0.75)]">
                <CalendarIcon size={13} />
                {tournament.dates_label}
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-[rgba(237,244,239,0.75)]">
                <ClockIcon size={13} />
                {tournament.team_count} ta jamoa
              </div>
            </div>
            <div
              className="flex h-[74px] w-[74px] items-center justify-center rounded-[22px] text-[#E9C464]"
              style={{
                background: "linear-gradient(140deg,#4A3A10,#241A05)",
                border: "1px solid rgba(233,196,100,0.5)",
                boxShadow: "0 0 34px rgba(233,196,100,0.25)",
              }}
            >
              <TrophyIcon size={34} strokeWidth={1.6} />
            </div>
          </div>
        </div>

        {/* Tablar */}
        <div className="no-scrollbar flex gap-0.5 overflow-x-auto border-b border-[var(--border)] px-3.5">
          {tabs.map((t) => {
            const on = t === tab;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-none cursor-pointer px-2 py-2.5 text-[10.5px] transition-colors"
                style={{
                  fontWeight: on ? 700 : 600,
                  color: on ? "#2FD871" : muted,
                  borderBottom: `2px solid ${on ? "#2FD871" : "transparent"}`,
                }}
              >
                {t}
              </button>
            );
          })}
        </div>

        {/* ── Jadval ────────────────────────────────────────────────── */}
        {tab === "Jadval" && (
          <div className="px-5 pb-6 pt-[18px]">
            <div className="mb-3.5 flex items-center justify-between">
              <div className="text-[15px] font-bold">Guruh {standings[0]?.group_name ?? "A"}</div>
              <div className="rounded-full border border-[rgba(47,216,113,0.25)] bg-[rgba(47,216,113,0.08)] px-2.5 py-1 text-[10px] font-semibold text-[#3BE07C]">
                {standings[0]?.played ?? 0}-tur o&apos;ynaldi
              </div>
            </div>

            {standings.length === 0 ? (
              <EmptyState>Jadval ma&apos;lumotlari hali yo&apos;q</EmptyState>
            ) : (
              <>
                <div
                  className="grid gap-0.5 px-3 pb-2 text-center text-[9.5px] font-semibold"
                  style={{ gridTemplateColumns: cols, color: "var(--fg-muted)" }}
                >
                  <div>#</div>
                  <div className="text-left">Jamoa</div>
                  <div>O&apos;</div>
                  <div>G&apos;</div>
                  <div>D</div>
                  <div>M</div>
                  <div>T/F</div>
                  <div>O</div>
                </div>

                <div className="flex flex-col gap-1.5">
                  {standings.map((row) => {
                    const hot = row.pos <= 2;
                    return (
                      <div
                        key={row.id}
                        className="grid items-center gap-0.5 rounded-[14px] px-3 py-2.5 text-center text-[11.5px] transition-all hover:translate-x-[3px] hover:!border-[rgba(47,216,113,0.5)]"
                        style={{
                          gridTemplateColumns: cols,
                          background: hot ? "rgba(47,216,113,0.07)" : "var(--bg-soft)",
                          border: `1px solid ${hot ? "rgba(47,216,113,0.3)" : "var(--border)"}`,
                        }}
                      >
                        <div className="font-bold" style={{ color: hot ? "#3BE07C" : "var(--fg-soft)" }}>
                          {row.pos}
                        </div>
                        <div className="flex min-w-0 items-center gap-2 text-left">
                          <Crest gradient={row.team.crest_gradient} init={row.team.init} size={26} fontSize={8.5} />
                          <div className="truncate font-semibold">{row.team.name}</div>
                        </div>
                        <div style={{ color: soft }}>{row.played}</div>
                        <div style={{ color: soft }}>{row.won}</div>
                        <div style={{ color: soft }}>{row.drawn}</div>
                        <div style={{ color: soft }}>{row.lost}</div>
                        <div className="text-[10.5px]" style={{ color: "var(--fg-soft)" }}>
                          {row.goals_for}/{row.goals_against}
                        </div>
                        <div className="font-extrabold text-[#3BE07C]">{row.points}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3.5 flex items-center gap-2 text-[10px]" style={{ color: muted }}>
                  <span className="h-2 w-2 rounded-[3px] bg-[rgba(47,216,113,0.5)]" />
                  Pley-off bosqichiga chiqish zonasi
                </div>
              </>
            )}
          </div>
        )}

        {/* ── O'yinlar ──────────────────────────────────────────────── */}
        {tab === "O'yinlar" && (
          <div className="flex flex-col gap-2.5 px-5 pb-6 pt-[18px]">
            {live.length > 0 && (
              <>
                <div className="mb-1 flex items-center gap-2">
                  <span className="h-[7px] w-[7px] animate-pulse rounded-full bg-[#3BE07C]" />
                  <div className="text-[15px] font-bold">Hozir o&apos;ynalmoqda</div>
                </div>
                {live.map((m) => (
                  <FixtureCard key={m.id} match={m} />
                ))}
              </>
            )}

            <div className={`mb-1 flex items-center justify-between ${live.length > 0 ? "mt-3" : ""}`}>
              <div className="text-[15px] font-bold">Kelgusi o&apos;yinlar</div>
              <div className="rounded-full border border-[var(--border)] bg-[var(--card)] px-2.5 py-1 text-[10px] font-semibold" style={{ color: soft }}>
                {scheduled.length} ta
              </div>
            </div>

            {scheduled.length === 0 ? (
              <EmptyState>Rejalashtirilgan o&apos;yinlar yo&apos;q</EmptyState>
            ) : (
              scheduled.map((m) => <FixtureCard key={m.id} match={m} />)
            )}
          </div>
        )}

        {/* ── Natijalar ─────────────────────────────────────────────── */}
        {tab === "Natijalar" && (
          <div className="flex flex-col gap-2 px-5 pb-6 pt-[18px]">
            <div className="mb-1 flex items-center justify-between">
              <div className="text-[15px] font-bold">Yakunlangan o&apos;yinlar</div>
              <div className="rounded-full border border-[var(--border)] bg-[var(--card)] px-2.5 py-1 text-[10px] font-semibold" style={{ color: soft }}>
                {results.length} ta
              </div>
            </div>

            {results.length === 0 ? (
              <EmptyState>Hali birorta o&apos;yin yakunlanmagan</EmptyState>
            ) : (
              results.map((m) => <ResultRow key={m.id} match={m} />)
            )}
          </div>
        )}

        {/* ── To'purarlar ───────────────────────────────────────────── */}
        {tab === "To'purarlar" && (
          <div className="flex flex-col gap-2.5 px-5 pb-6 pt-[18px]">
            <div className="mb-1 text-[15px] font-bold">Eng ko&apos;p gol urganlar</div>

            {topScorers.length === 0 ? (
              <EmptyState>Gol statistikasi hali kiritilmagan</EmptyState>
            ) : (
              topScorers.map((p, i) => {
                const rs = rankStyles[i] ?? rankDefault;
                return (
                  <div
                    key={`${p.player_name}-${p.team_id}`}
                    className="flex items-center gap-3 rounded-[18px] border border-[var(--border)] bg-[var(--card)] px-4 py-3 transition-all hover:translate-x-1 hover:border-[rgba(47,216,113,0.45)]"
                  >
                    <div
                      className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-[9px] text-xs font-extrabold"
                      style={{ background: rs.bg, color: rs.color, border: `1px solid ${rs.border}` }}
                    >
                      {i + 1}
                    </div>
                    <Crest gradient={p.team.crest_gradient} init={p.team.init} size={38} fontSize={11.5} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-bold">{p.player_name}</div>
                      <div className="mt-0.5 text-[10.5px]" style={{ color: muted }}>
                        {p.team.name}
                        {p.assists > 0 ? ` · ${p.assists} uzatma` : ""}
                      </div>
                    </div>
                    <div className="flex flex-none flex-col items-center">
                      <div className="text-xl font-extrabold text-[#3BE07C]" style={{ textShadow: "0 0 16px rgba(47,216,113,0.4)" }}>
                        {p.goals}
                      </div>
                      <div className="text-[9px]" style={{ color: muted }}>
                        gol
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── Reglament ─────────────────────────────────────────────── */}
        {tab === "Reglament" && (
          <div className="flex flex-col gap-2.5 px-5 pb-6 pt-[18px]">
            <div className="mb-1 text-[15px] font-bold">Turnir qoidalari</div>

            {regulationItems.length === 0 ? (
              <EmptyState>Reglament hali kiritilmagan</EmptyState>
            ) : (
              <ol className="flex flex-col gap-2">
                {regulationItems.map((item, i) => (
                  <li
                    key={i}
                    className="flex gap-3 rounded-[14px] border border-[var(--border)] bg-[var(--card)] px-3.5 py-3 text-[12px] leading-relaxed"
                    style={{ color: soft }}
                  >
                    <span className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-[8px] bg-[rgba(47,216,113,0.12)] text-[10px] font-extrabold text-[#3BE07C]">
                      {i + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </div>
      <BottomNav />
    </>
  );
}
