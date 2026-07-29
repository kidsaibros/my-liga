"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Crest } from "@/components/ui";
import { BackIcon, ShareIcon, CalendarIcon, PinIcon, SendIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { useSessionProfile } from "@/components/SessionProvider";
import { formatMatchDateTime } from "@/lib/format";
import type { ChatMessage, Lineup, Match, Player, PlayerPosition, Standing, Team } from "@/lib/types";

const tabs = ["Tarkib", "O'yin haqida", "Live chat"];

/** "Javlonbek Rahimov" → "JR" — chat avatarida ko'rsatiladigan bosh harflar. */
function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

const positionOrder: PlayerPosition[] = ["GK", "DEF", "MID", "FWD"];
const positionLabel: Record<PlayerPosition, string> = {
  GK: "Darvozabon",
  DEF: "Himoyachi",
  MID: "Yarim himoyachi",
  FWD: "Hujumchi",
};

export function MatchClient({
  match,
  initialMessages,
  players = [],
  lineups = [],
  standings = [],
}: {
  match: Match;
  initialMessages: ChatMessage[];
  players?: Player[];
  lineups?: Lineup[];
  standings?: Standing[];
}) {
  const router = useRouter();
  // Cookie-aware brauzer klienti — auth sessiyasi bilan bir xil (eski umumiy
  // `lib/supabase.ts` singleton'i sessiyani bilmasdi, shuning uchun RLS ostida
  // yozish anon sifatida ketardi).
  const supabase = useMemo(() => createClient(), []);
  const [tab, setTab] = useState("Live chat");
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [shared, setShared] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // O'yinni ulashish: telefonda tizim ulashish oynasi, aks holda havolani nusxalash.
  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = `${match.home_team.name} — ${match.away_team.name}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, text: `${title} · MY LIGA`, url });
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 1800);
      }
    } catch {
      // Foydalanuvchi bekor qildi.
    }
  }
  // Chat faqat kirgan foydalanuvchilar uchun — RLS ham aynan shuni talab qiladi.
  const profile = useSessionProfile();

  useEffect(() => {
    const channel = supabase
      .channel(`chat:${match.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `match_id=eq.${match.id}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [match.id, supabase]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  /**
   * Chat xabarini yuborish.
   *
   * MUHIM: `chat_messages` RLS siyosati `insert_own` — `auth.uid() = user_id`
   * shartini talab qiladi (0004 migratsiyasi). Ilgari bu yerda `user_id`
   * yuborilmasdi va muallif nomi doim "Siz" edi, natijada HAR BIR xabar RLS
   * tomonidan rad etilardi, natija esa tekshirilmagani uchun xato jimgina
   * yo'qolardi. Endi sessiyadan `userId` va haqiqiy ism olinadi, xato esa
   * foydalanuvchiga ko'rsatiladi.
   */
  async function sendMessage() {
    const text = draft.trim();
    if (!text || !profile) return;

    setSendError(null);
    setDraft("");

    const { error } = await supabase.from("chat_messages").insert({
      match_id: match.id,
      user_id: profile.userId,
      author_name: profile.fullName,
      author_init: initialsOf(profile.fullName),
      avatar_gradient: "linear-gradient(140deg,#2FD871,#128A48)",
      text,
      is_bot: false,
    });

    if (error) {
      // Xabar yuborilmadi — matnni qaytarib beramiz, foydalanuvchi qayta urinsin.
      setDraft(text);
      setSendError("Xabar yuborilmadi. Internetni tekshirib, qayta urinib ko'ring.");
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-1">
        <button
          onClick={() => router.back()}
          className="flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--fg)]"
        >
          <BackIcon size={16} />
        </button>
        <div className="text-center">
          <div className="text-[13px] font-bold">{match.tournament?.name}</div>
          <div className="mt-px text-[10px] text-[var(--fg-muted)]">Guruh {match.group_name}</div>
        </div>
        <button
          type="button"
          onClick={handleShare}
          aria-label="Ulashish"
          className="relative flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--fg)]"
        >
          <ShareIcon size={15} />
          {shared && (
            <span
              className="absolute right-0 top-[44px] z-10 whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-semibold"
              style={{ background: "#0E9F6E", color: "#fff" }}
            >
              Havola nusxalandi
            </span>
          )}
        </button>
      </div>

      {/* Hisob tablosi */}
      <div
        className="mx-5 mt-4 rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-5 backdrop-blur"
        style={{ boxShadow: "0 12px 32px rgba(0,0,0,0.4)" }}
      >
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex flex-col items-center gap-2">
            <Crest
              gradient={match.home_team.crest_gradient}
              init={match.home_team.init}
              size={54}
              fontSize={14}
              color={match.home_team.crest_color}
              border={match.home_team.crest_border}
              glow="0 0 22px rgba(47,216,113,0.2)"
            />
            <div className="text-xs font-bold">{match.home_team.name}</div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="text-[34px] font-extrabold leading-none tracking-tighter">
              {match.home_score}
              <span className="mx-1.5 text-[var(--fg-muted)]">:</span>
              {match.away_score}
            </div>
            {match.status === "live" ? (
              <span
                className="flex items-center gap-2 rounded-full px-3.5 py-1.5"
                style={{
                  background: "rgba(232,72,72,0.12)",
                  border: "1px solid rgba(232,72,72,0.45)",
                  boxShadow: "0 0 18px rgba(232,72,72,0.2)",
                }}
              >
                <span className="relative h-[7px] w-[7px]">
                  <span
                    className="absolute inset-0 rounded-full bg-[#F05555]"
                    style={{ animation: "livePing 1.4s ease-out infinite" }}
                  />
                  <span className="absolute inset-0 rounded-full bg-[#F05555]" />
                </span>
                <span
                  className="text-[10.5px] font-extrabold tracking-wider text-[#F58080]"
                  style={{ animation: "livePulse 1.4s ease-in-out infinite" }}
                >
                  LIVE · {match.minute}&apos;
                </span>
              </span>
            ) : match.status === "finished" ? (
              <span className="rounded-full border border-[rgba(47,216,113,0.4)] bg-[rgba(47,216,113,0.12)] px-3.5 py-1.5 text-[10.5px] font-extrabold text-[#3BE07C]">
                Tugadi
              </span>
            ) : (
              <span className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3.5 py-1.5 text-[10.5px] font-extrabold text-[var(--fg-soft)]">
                Hali boshlanmagan
              </span>
            )}
          </div>

          <div className="flex flex-col items-center gap-2">
            <Crest
              gradient={match.away_team.crest_gradient}
              init={match.away_team.init}
              size={54}
              fontSize={14}
              color={match.away_team.crest_color}
              border={match.away_team.crest_border}
              glow="0 0 22px rgba(240,150,60,0.15)"
            />
            <div className="text-xs font-bold">{match.away_team.name}</div>
          </div>
        </div>

        <div className="mt-4 flex justify-center gap-[18px] border-t border-[var(--border)] pt-3.5 text-[10.5px] text-[var(--fg-soft)]">
          <div className="flex items-center gap-1.5">
            <CalendarIcon size={12} />
            {formatMatchDateTime(match.kickoff_at)}
          </div>
          <div className="flex items-center gap-1.5">
            <PinIcon size={12} />
            {match.venue}
          </div>
        </div>
      </div>

      {/* Tablar */}
      <div className="mt-4 flex gap-1 border-b border-[var(--border)] px-5">
        {tabs.map((t) => {
          const on = t === tab;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="cursor-pointer px-3.5 py-2.5 text-xs transition-colors"
              style={{
                fontWeight: on ? 700 : 600,
                color: on ? "#2FD871" : "var(--fg-muted)",
                borderBottom: `2px solid ${on ? "#2FD871" : "transparent"}`,
              }}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* Kontent */}
      {tab === "Live chat" ? (
        <>
          <div ref={scrollRef} className="app-scroll flex flex-1 flex-col gap-3.5 px-5 py-4">
            {messages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-2.5">
                <Crest gradient={msg.avatar_gradient} init={msg.author_init} size={34} fontSize={11} border="transparent" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-bold" style={{ color: msg.is_bot ? "#3BE07C" : "var(--fg)" }}>
                      {msg.author_name}
                    </span>
                    <span className="text-[9.5px] text-[var(--fg-muted)]">
                      {new Date(msg.created_at).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div
                    className="mt-1 inline-block px-3 py-2 text-xs text-[var(--fg)]"
                    style={{
                      background: msg.is_bot ? "rgba(47,216,113,0.08)" : "var(--card)",
                      border: `1px solid ${msg.is_bot ? "rgba(47,216,113,0.3)" : "var(--border)"}`,
                      borderRadius: "4px 14px 14px 14px",
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Xabar yozish — faqat kirgan foydalanuvchi uchun (RLS ham shuni talab qiladi) */}
          <div className="border-t border-[var(--border)] bg-[var(--bg-soft)] px-5 pb-9 pt-3 backdrop-blur-xl">
            {sendError && (
              <div className="mb-2 text-center text-[11px] text-[#E8A0A0]" role="alert">
                {sendError}
              </div>
            )}

            {profile ? (
              <div className="flex items-center gap-2.5">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendMessage();
                  }}
                  maxLength={500}
                  placeholder="Xabar yozing..."
                  aria-label="Chat xabari"
                  className="flex-1 rounded-full border border-[var(--border)] bg-[var(--card)] px-[18px] py-3 text-[12.5px] text-[var(--fg)] outline-none transition-colors focus:border-[rgba(47,216,113,0.6)]"
                />
                <button
                  onClick={sendMessage}
                  disabled={draft.trim() === ""}
                  aria-label="Yuborish"
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-[#06130B] transition-transform hover:scale-[1.08] disabled:opacity-40 disabled:hover:scale-100"
                  style={{
                    background: "linear-gradient(140deg,#2FD871,#128A48)",
                    boxShadow: "0 0 20px rgba(47,216,113,0.35)",
                  }}
                >
                  <SendIcon size={18} />
                </button>
              </div>
            ) : (
              <div className="rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-center text-[12px] text-[var(--fg-muted)]">
                Chatda yozish uchun hisobingizga kiring
              </div>
            )}
          </div>
        </>
      ) : tab === "Tarkib" ? (
        <div className="app-scroll flex flex-1 flex-col gap-4 px-5 py-4">
          <TeamRoster team={match.home_team} players={players} lineups={lineups} />
          <TeamRoster team={match.away_team} players={players} lineups={lineups} />
        </div>
      ) : (
        <MatchInfo match={match} standings={standings} />
      )}
    </div>
  );
}

/** Bitta jamoaning tarkibi: sxema, asosiy o'n bir va zaxira. */
function TeamRoster({
  team,
  players,
  lineups,
}: {
  team: Team;
  players: Player[];
  lineups: Lineup[];
}) {
  const squad = players.filter((p) => p.team_id === team.id);
  const lineup = lineups.find((l) => l.team_id === team.id);
  const starters = squad.filter((p) => p.is_starter);
  const bench = squad.filter((p) => !p.is_starter);

  return (
    <div className="rounded-[18px] border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="flex items-center gap-2.5">
        <Crest gradient={team.crest_gradient} init={team.init} size={30} fontSize={9.5} />
        <div className="flex-1 text-[13px] font-bold">{team.name}</div>
        {lineup && (
          <span className="rounded-full border border-[rgba(47,216,113,0.25)] bg-[rgba(47,216,113,0.08)] px-2.5 py-1 text-[10px] font-extrabold text-[#3BE07C]">
            {lineup.formation}
          </span>
        )}
      </div>

      {squad.length === 0 ? (
        <div className="mt-3 border-t border-[var(--border)] pt-3 text-center text-[12px] text-[var(--fg-muted)]">
          Tarkib hali kiritilmagan
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-3 border-t border-[var(--border)] pt-3">
          {starters.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--fg-muted)]">
                Asosiy tarkib
              </div>
              {positionOrder.map((pos) => {
                const group = starters.filter((p) => p.position === pos);
                if (group.length === 0) return null;
                return (
                  <div key={pos} className="flex flex-col gap-1.5">
                    <div className="text-[9.5px] text-[var(--fg-muted)]">{positionLabel[pos]}</div>
                    {group.map((p) => (
                      <PlayerRow
                        key={p.id}
                        player={p}
                        isCaptain={lineup?.captain_player_id === p.id}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {bench.length > 0 && (
            <div className="flex flex-col gap-1.5 border-t border-[var(--border)] pt-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--fg-muted)]">
                Zaxira ({bench.length})
              </div>
              {bench.map((p) => (
                <PlayerRow key={p.id} player={p} isCaptain={lineup?.captain_player_id === p.id} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PlayerRow({ player, isCaptain }: { player: Player; isCaptain: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-[24px] w-[24px] flex-none items-center justify-center rounded-[8px] bg-[var(--card)] text-[10.5px] font-extrabold text-[var(--fg-soft)]">
        {player.number}
      </span>
      <span className="min-w-0 flex-1 truncate text-[12px] font-semibold">{player.name}</span>
      {isCaptain && (
        <span
          className="flex-none rounded-[6px] px-1.5 py-0.5 text-[9px] font-extrabold"
          style={{ background: "rgba(233,196,100,0.14)", color: "#E9C464" }}
          title="Kapitan"
        >
          K
        </span>
      )}
      <span className="flex-none text-[9.5px] text-[var(--fg-muted)]">{player.position}</span>
    </div>
  );
}

/** «O'yin haqida» — uchrashuv tafsilotlari va ikkala jamoaning jadvaldagi o'rni. */
function MatchInfo({ match, standings }: { match: Match; standings: Standing[] }) {
  const rowOf = (teamId: string) => standings.find((s) => s.team_id === teamId);
  const home = rowOf(match.home_team_id);
  const away = rowOf(match.away_team_id);

  const statusText =
    match.status === "live"
      ? `Jonli${match.minute != null ? ` · ${match.minute}-daqiqa` : ""}`
      : match.status === "finished"
        ? "Yakunlangan"
        : "Hali boshlanmagan";

  const details: { label: string; value: string }[] = [
    { label: "Turnir", value: match.tournament?.name ?? "—" },
    { label: "Guruh", value: match.group_name ?? "—" },
    { label: "Sana va vaqt", value: formatMatchDateTime(match.kickoff_at) },
    { label: "Joy", value: match.venue ?? "—" },
    { label: "Holati", value: statusText },
  ];

  return (
    <div className="app-scroll flex flex-1 flex-col gap-4 px-5 py-4">
      <div className="rounded-[18px] border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--fg-muted)]">
          Uchrashuv ma&apos;lumotlari
        </div>
        <div className="mt-2.5 flex flex-col">
          {details.map((d, i) => (
            <div
              key={d.label}
              className="flex items-center justify-between gap-3 py-2.5 text-[12px]"
              style={{ borderTop: i === 0 ? "none" : "1px solid var(--border)" }}
            >
              <span className="text-[var(--fg-muted)]">{d.label}</span>
              <span className="min-w-0 truncate text-right font-semibold">{d.value}</span>
            </div>
          ))}
        </div>
      </div>

      {(home || away) && (
        <div className="rounded-[18px] border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--fg-muted)]">
            Turnir jadvalidagi o&apos;rni
          </div>
          <div className="mt-3 flex flex-col gap-2.5">
            {[
              { team: match.home_team, row: home },
              { team: match.away_team, row: away },
            ].map(({ team, row }) => (
              <div key={team.id} className="flex items-center gap-2.5">
                <Crest gradient={team.crest_gradient} init={team.init} size={26} fontSize={8.5} />
                <span className="min-w-0 flex-1 truncate text-[12px] font-semibold">{team.name}</span>
                {row ? (
                  <>
                    <span className="text-[10.5px] text-[var(--fg-muted)]">
                      {row.pos}-o&apos;rin · {row.played} o&apos;yin
                    </span>
                    <span className="flex-none text-[14px] font-extrabold text-[#3BE07C]">{row.points}</span>
                  </>
                ) : (
                  <span className="text-[10.5px] text-[var(--fg-muted)]">jadvalda yo&apos;q</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
