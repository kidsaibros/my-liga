"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createMatchEvent, deleteMatchEvent, listMatchEvents } from "@/lib/actions/match-events";
import type { Match, MatchEvent, MatchEventType, Player } from "@/lib/types";

const eventTypes: { id: MatchEventType; label: string; icon: string }[] = [
  { id: "goal", label: "Gol", icon: "⚽" },
  { id: "assist", label: "Uzatma", icon: "🅰" },
  { id: "own_goal", label: "O'z darvozasiga", icon: "🔴" },
  { id: "yellow", label: "Sariq kartochka", icon: "🟨" },
  { id: "red", label: "Qizil kartochka", icon: "🟥" },
];

const typeMeta = (t: MatchEventType) => eventTypes.find((e) => e.id === t);

/**
 * Uchrashuv hodisalari (gol, uzatma, kartochka) — «To'purarlar» ro'yxati
 * shulardan hisoblanadi, shuning uchun hisob kiritilgandan keyin shu yerda
 * gol mualliflari belgilanadi.
 */
export function MatchEventsEditor({
  match,
  players,
  onError,
}: {
  match: Match;
  players: Player[];
  onError: (msg: string) => void;
}) {
  const [events, setEvents] = useState<MatchEvent[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    team_id: match.home_team_id,
    player_name: "",
    type: "goal" as MatchEventType,
    minute: "",
  });

  /**
   * `onError` ni ref orqali ushlaymiz. Sababi: ota komponent uni inline arrow
   * sifatida uzatadi (`onError={(msg) => setToast(...)}`), ya'ni har renderda
   * yangi havola. Agar u useEffect bog'liqligida tursa, hisob maydoniga
   * yozilgan HAR BIR harf hodisalarni serverdan qayta yuklardi.
   * Effekt faqat `match.id` ga bog'liq bo'lishi kerak.
   */
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const reportError = useCallback((msg: string) => onErrorRef.current(msg), []);

  useEffect(() => {
    let alive = true;
    listMatchEvents(match.id).then((r) => {
      if (!alive) return;
      if (r.error !== null) {
        reportError(r.error);
        // Bo'sh ro'yxatga tushiramiz — aks holda «Yuklanmoqda...» abadiy qoladi.
        setEvents([]);
      } else {
        setEvents(r.data);
      }
    });
    return () => {
      alive = false;
    };
  }, [match.id, reportError]);

  const teamName = (id: string) =>
    id === match.home_team_id ? match.home_team.name : match.away_team.name;

  // Roster kiritilgan bo'lsa — tanlangan jamoa o'yinchilarini taklif qilamiz.
  const suggestions = players.filter((p) => p.team_id === form.team_id);

  async function add() {
    const name = form.player_name.trim();
    if (!name) return;
    setSaving(true);

    const matched = suggestions.find((p) => p.name.toLowerCase() === name.toLowerCase());
    const result = await createMatchEvent({
      match_id: match.id,
      team_id: form.team_id,
      player_id: matched?.id ?? null,
      player_name: name,
      type: form.type,
      minute: form.minute === "" ? null : Number(form.minute),
    });
    setSaving(false);

    if (result.error !== null) {
      onError(result.error);
      return;
    }
    setEvents((prev) => [...(prev ?? []), result.data]);
    setForm({ ...form, player_name: "", minute: "" });
  }

  async function remove(id: string) {
    const result = await deleteMatchEvent(id);
    if (result.error !== null) {
      onError(result.error);
      return;
    }
    setEvents((prev) => (prev ?? []).filter((e) => e.id !== id));
  }

  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-white/[0.07] pt-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-[rgba(237,244,239,0.4)]">
        O&apos;yin hodisalari
      </div>

      {events === null ? (
        <div className="py-1 text-[11.5px] text-[rgba(237,244,239,0.35)]">Yuklanmoqda...</div>
      ) : events.length === 0 ? (
        <div className="py-1 text-[11.5px] text-[rgba(237,244,239,0.35)]">
          Hali hodisa yo&apos;q — gol urganlarni qo&apos;shing
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {events.map((e) => (
            <div key={e.id} className="flex items-center gap-2 text-[11.5px]">
              <span className="w-8 flex-none text-right text-[rgba(237,244,239,0.45)]">
                {e.minute != null ? `${e.minute}'` : "—"}
              </span>
              <span className="flex-none">{typeMeta(e.type)?.icon}</span>
              <span className="min-w-0 flex-1 truncate font-semibold">{e.player_name}</span>
              <span className="flex-none truncate text-[10px] text-[rgba(237,244,239,0.4)]">
                {teamName(e.team_id)}
              </span>
              <button
                onClick={() => remove(e.id)}
                aria-label="Hodisani o'chirish"
                className="flex-none rounded-md px-1.5 py-0.5 text-[11px] text-[#F87171] hover:bg-[rgba(239,68,68,0.12)]"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Qo'shish */}
      <div className="mt-1 flex flex-col gap-2">
        <div className="flex gap-2">
          <select
            value={form.team_id}
            onChange={(e) => setForm({ ...form, team_id: e.target.value })}
            className={`${inputCls} flex-1`}
            aria-label="Jamoa"
          >
            <option value={match.home_team_id}>{match.home_team.name}</option>
            <option value={match.away_team_id}>{match.away_team.name}</option>
          </select>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as MatchEventType })}
            className={`${inputCls} flex-1`}
            aria-label="Hodisa turi"
          >
            {eventTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <input
            list={`roster-${match.id}`}
            value={form.player_name}
            onChange={(e) => setForm({ ...form, player_name: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            placeholder="O'yinchi ismi"
            className={`${inputCls} flex-1`}
            aria-label="O'yinchi ismi"
          />
          <datalist id={`roster-${match.id}`}>
            {suggestions.map((p) => (
              <option key={p.id} value={p.name} />
            ))}
          </datalist>
          <input
            type="number"
            min={0}
            max={130}
            value={form.minute}
            onChange={(e) => setForm({ ...form, minute: e.target.value })}
            placeholder="daq."
            className={`${inputCls} w-20 text-center`}
            aria-label="Daqiqa"
          />
          <button
            onClick={add}
            disabled={saving || form.player_name.trim() === ""}
            className="flex-none rounded-xl px-3.5 text-[12px] font-bold text-[#06130B] disabled:opacity-50"
            style={{ background: "linear-gradient(140deg,#2FD871,#128A48)" }}
          >
            {saving ? "..." : "Qo'shish"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-2 text-[12.5px] text-[#EDF4EF] outline-none focus:border-[rgba(47,216,113,0.5)]";
