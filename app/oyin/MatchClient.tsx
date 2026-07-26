"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Crest } from "@/components/ui";
import { BackIcon, ShareIcon, CalendarIcon, PinIcon, SendIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { formatMatchDateTime } from "@/lib/format";
import type { ChatMessage, Match } from "@/lib/types";

const tabs = ["Tarkib", "O'yin haqida", "Live chat"];

export function MatchClient({
  match,
  initialMessages,
}: {
  match: Match;
  initialMessages: ChatMessage[];
}) {
  const router = useRouter();
  // Cookie-aware brauzer klienti — auth sessiyasi bilan bir xil (eski umumiy
  // `lib/supabase.ts` singleton'i sessiyani bilmasdi, shuning uchun RLS ostida
  // yozish anon sifatida ketardi).
  const supabase = useMemo(() => createClient(), []);
  const [tab, setTab] = useState("Live chat");
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

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

  async function sendMessage() {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    await supabase.from("chat_messages").insert({
      match_id: match.id,
      author_name: "Siz",
      author_init: "S",
      avatar_gradient: "linear-gradient(140deg,#2FD871,#128A48)",
      text,
      is_bot: false,
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-1">
        <button
          onClick={() => router.back()}
          className="flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.05] text-[#EDF4EF]"
        >
          <BackIcon size={16} />
        </button>
        <div className="text-center">
          <div className="text-[13px] font-bold">{match.tournament?.name}</div>
          <div className="mt-px text-[10px] text-[rgba(237,244,239,0.5)]">Guruh {match.group_name}</div>
        </div>
        <button className="flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.05] text-[#EDF4EF]">
          <ShareIcon size={15} />
        </button>
      </div>

      {/* Hisob tablosi */}
      <div
        className="mx-5 mt-4 rounded-[22px] border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur"
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
              <span className="mx-1.5 text-[rgba(237,244,239,0.35)]">:</span>
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
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-1.5 text-[10.5px] font-extrabold text-[rgba(237,244,239,0.6)]">
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

        <div className="mt-4 flex justify-center gap-[18px] border-t border-white/[0.06] pt-3.5 text-[10.5px] text-[rgba(237,244,239,0.55)]">
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
      <div className="mt-4 flex gap-1 border-b border-white/[0.06] px-5">
        {tabs.map((t) => {
          const on = t === tab;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="cursor-pointer px-3.5 py-2.5 text-xs transition-colors"
              style={{
                fontWeight: on ? 700 : 600,
                color: on ? "#2FD871" : "rgba(237,244,239,0.45)",
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
                    <span className="text-xs font-bold" style={{ color: msg.is_bot ? "#3BE07C" : "#EDF4EF" }}>
                      {msg.author_name}
                    </span>
                    <span className="text-[9.5px] text-[rgba(237,244,239,0.35)]">
                      {new Date(msg.created_at).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div
                    className="mt-1 inline-block px-3 py-2 text-xs text-[rgba(237,244,239,0.85)]"
                    style={{
                      background: msg.is_bot ? "rgba(47,216,113,0.08)" : "rgba(255,255,255,0.05)",
                      border: `1px solid ${msg.is_bot ? "rgba(47,216,113,0.3)" : "rgba(255,255,255,0.08)"}`,
                      borderRadius: "4px 14px 14px 14px",
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Xabar yozish */}
          <div className="flex items-center gap-2.5 border-t border-white/[0.06] bg-[rgba(10,14,11,0.85)] px-5 pb-9 pt-3 backdrop-blur-xl">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
              placeholder="Xabar yozing..."
              className="flex-1 rounded-full border border-white/10 bg-white/[0.05] px-[18px] py-3 text-[12.5px] text-[#EDF4EF] outline-none transition-colors focus:border-[rgba(47,216,113,0.6)]"
            />
            <button
              onClick={sendMessage}
              aria-label="Yuborish"
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-[#06130B] transition-transform hover:scale-[1.08]"
              style={{
                background: "linear-gradient(140deg,#2FD871,#128A48)",
                boxShadow: "0 0 20px rgba(47,216,113,0.35)",
              }}
            >
              <SendIcon size={18} />
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center px-5 py-16 text-center text-sm text-[rgba(237,244,239,0.4)]">
          «{tab}» bo'limi tez orada
        </div>
      )}
    </div>
  );
}
