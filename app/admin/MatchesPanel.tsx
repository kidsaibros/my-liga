"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createMatch, updateMatch, updateMatchScore, deleteMatch } from "@/lib/actions/matches";
import { MatchEventsEditor } from "./MatchEventsEditor";
import { formatMatchDateTime } from "@/lib/format";
import type { Match, MatchStatus, Player, Team, Tournament } from "@/lib/types";
import { PlusIcon } from "@/components/icons";
import { Crest } from "@/components/ui";
import { Toast } from "@/components/Toast";

const statusOptions: { id: MatchStatus; label: string }[] = [
  { id: "scheduled", label: "Rejalashtirilgan" },
  { id: "live", label: "Jonli" },
  { id: "finished", label: "Yakunlangan" },
];

const statusLabel = (s: MatchStatus) => statusOptions.find((o) => o.id === s)?.label ?? s;

type FormState = {
  tournament_id: string;
  home_team_id: string;
  away_team_id: string;
  group_name: string;
  venue: string;
  kickoff_at: string;
  status: MatchStatus;
  is_featured: boolean;
};

/** ISO → `datetime-local` inputi kutadigan "YYYY-MM-DDTHH:mm" (mahalliy vaqtda). */
function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function emptyForm(tournamentId: string): FormState {
  return {
    tournament_id: tournamentId,
    home_team_id: "",
    away_team_id: "",
    group_name: "",
    venue: "",
    kickoff_at: toLocalInput(new Date().toISOString()),
    status: "scheduled",
    is_featured: false,
  };
}

export function MatchesPanel({
  initialMatches,
  tournaments,
  teams,
  players,
}: {
  initialMatches: Match[];
  tournaments: Tournament[];
  teams: Team[];
  players: Player[];
}) {
  const [items, setItems] = useState(initialMatches);
  const [filterTournament, setFilterTournament] = useState<string>(tournaments[0]?.id ?? "");
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm(tournaments[0]?.id ?? ""));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; kind: "success" | "error" } | null>(null);
  // Hisob tahriri qaysi uchrashuvda ochiq
  const [scoringId, setScoringId] = useState<string | null>(null);
  const [score, setScore] = useState({ home: "0", away: "0", status: "finished" as MatchStatus, minute: "0" });

  // Tanlangan turnir (liga) a'zolari — o'yin qo'shishda jamoa ro'yxatini shularga cheklaymiz.
  const [memberIds, setMemberIds] = useState<Set<string> | null>(null);
  useEffect(() => {
    if (editingId === null || !form.tournament_id) {
      setMemberIds(null);
      return;
    }
    let active = true;
    createClient()
      .from("tournament_teams")
      .select("team_id")
      .eq("tournament_id", form.tournament_id)
      .then(({ data }) => {
        if (active) setMemberIds(new Set((data ?? []).map((r) => r.team_id as string)));
      });
    return () => {
      active = false;
    };
  }, [editingId, form.tournament_id]);

  // A'zolar belgilangan bo'lsa — faqat shular; aks holda barcha jamoalar (zaxira).
  const formTeams = useMemo(
    () => (memberIds && memberIds.size > 0 ? teams.filter((t) => memberIds.has(t.id)) : teams),
    [teams, memberIds]
  );

  const visible = useMemo(
    () =>
      items
        .filter((m) => !filterTournament || m.tournament_id === filterTournament)
        .sort((a, b) => +new Date(b.kickoff_at) - +new Date(a.kickoff_at)),
    [items, filterTournament]
  );

  function openCreate() {
    setForm(emptyForm(filterTournament || tournaments[0]?.id || ""));
    setError(null);
    setEditingId("new");
  }

  function openEdit(m: Match) {
    setForm({
      tournament_id: m.tournament_id,
      home_team_id: m.home_team_id,
      away_team_id: m.away_team_id,
      group_name: m.group_name ?? "",
      venue: m.venue ?? "",
      kickoff_at: toLocalInput(m.kickoff_at),
      status: m.status,
      is_featured: m.is_featured,
    });
    setError(null);
    setEditingId(m.id);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      tournament_id: form.tournament_id,
      home_team_id: form.home_team_id,
      away_team_id: form.away_team_id,
      group_name: form.group_name.trim(),
      venue: form.venue.trim(),
      kickoff_at: form.kickoff_at,
      status: form.status,
      is_featured: form.is_featured,
    };

    const result = editingId === "new" ? await createMatch(payload) : await updateMatch(editingId, payload);

    // `!== null` bilan tekshiramiz: oddiy truthiness bo'sh satrni ("") ham
    // "xato yo'q" deb hisoblab, TypeScript'ga `data` null emasligini isbotlay olmaydi.
    if (result.error !== null) {
      setError(result.error);
      setSaving(false);
      return;
    }

    const saved = result.data;
    setItems((prev) => {
      // Yangi "featured" belgilansa, qolganlaridan bayroq olib tashlanadi (server ham shunday qiladi).
      const cleared = saved.is_featured ? prev.map((m) => ({ ...m, is_featured: false })) : prev;
      return editingId === "new" ? [saved, ...cleared] : cleared.map((m) => (m.id === saved.id ? saved : m));
    });
    setToast({ msg: editingId === "new" ? "Uchrashuv qo'shildi" : "Uchrashuv yangilandi", kind: "success" });
    setEditingId(null);
    setSaving(false);
  }

  function openScore(m: Match) {
    setScore({
      home: String(m.home_score),
      away: String(m.away_score),
      status: m.status === "scheduled" ? "finished" : m.status,
      minute: String(m.minute ?? 0),
    });
    setScoringId(m.id);
  }

  async function saveScore(id: string) {
    setSaving(true);
    const result = await updateMatchScore(id, {
      home_score: Number(score.home) || 0,
      away_score: Number(score.away) || 0,
      status: score.status,
      minute: Number(score.minute) || 0,
    });
    setSaving(false);

    if (result.error !== null) {
      setToast({ msg: result.error, kind: "error" });
      return;
    }
    setItems((prev) => prev.map((m) => (m.id === id ? result.data : m)));
    setScoringId(null);
    setToast({ msg: "Hisob saqlandi", kind: "success" });
  }

  async function handleDelete(m: Match) {
    if (!confirm(`«${m.home_team.name} — ${m.away_team.name}» uchrashuvi o'chirilsinmi?`)) return;
    const result = await deleteMatch(m.id);
    if (result.error !== null) {
      setToast({ msg: result.error, kind: "error" });
      return;
    }
    setItems((prev) => prev.filter((x) => x.id !== m.id));
    setToast({ msg: "Uchrashuv o'chirildi", kind: "success" });
  }

  if (tournaments.length === 0) {
    return (
      <div className="rounded-[18px] border border-[var(--border)] bg-[var(--card)] p-6 text-center text-[13px] text-[var(--fg-muted)]">
        Avval «Turnirlar» bo'limidan turnir qo'shing
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Turnir filtri + qo'shish */}
      <div className="flex gap-2">
        <select
          value={filterTournament}
          onChange={(e) => setFilterTournament(e.target.value)}
          className={`${inputCls} flex-1`}
        >
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <button
          onClick={openCreate}
          className="flex flex-none items-center gap-1.5 rounded-xl px-3.5 text-[12.5px] font-bold text-[#06130B]"
          style={{ background: "linear-gradient(140deg,#2FD871,#128A48)" }}
        >
          <PlusIcon size={14} />
          Qo&apos;shish
        </button>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-[18px] border border-[var(--border)] bg-[var(--card)] p-6 text-center text-[13px] text-[var(--fg-muted)]">
          Bu turnirda hali uchrashuv yo&apos;q
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map((m) => (
            <div key={m.id} className="rounded-[16px] border border-[var(--border)] bg-[var(--card)] p-3.5">
              <div className="flex items-center justify-between text-[10px] text-[var(--fg-muted)]">
                <span>{formatMatchDateTime(m.kickoff_at)}</span>
                <span className="flex items-center gap-1.5">
                  {m.is_featured && <span className="font-bold text-[#E9C464]">★ Asosiy</span>}
                  <span
                    className="rounded-full px-2 py-0.5 font-semibold"
                    style={{
                      background: m.status === "live" ? "rgba(47,216,113,0.14)" : "rgba(255,255,255,0.06)",
                      color: m.status === "live" ? "#3BE07C" : "var(--fg-soft)",
                    }}
                  >
                    {statusLabel(m.status)}
                    {m.status === "live" && m.minute != null ? ` ${m.minute}'` : ""}
                  </span>
                </span>
              </div>

              <div className="mt-2.5 flex items-center gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <Crest gradient={m.home_team.crest_gradient} init={m.home_team.init} size={26} fontSize={8.5} />
                  <span className="truncate text-[12.5px] font-semibold">{m.home_team.name}</span>
                </div>
                <div className="flex-none rounded-[9px] bg-[var(--card)] px-2.5 py-1 text-[13px] font-extrabold">
                  {m.status === "scheduled" ? "–" : `${m.home_score} : ${m.away_score}`}
                </div>
                <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                  <span className="truncate text-right text-[12.5px] font-semibold">{m.away_team.name}</span>
                  <Crest gradient={m.away_team.crest_gradient} init={m.away_team.init} size={26} fontSize={8.5} />
                </div>
              </div>

              {scoringId === m.id ? (
                <div className="mt-3 flex flex-col gap-2 border-t border-[var(--border)] pt-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={score.home}
                      onChange={(e) => setScore({ ...score, home: e.target.value })}
                      className={`${inputCls} text-center`}
                      aria-label="Uy egalari hisobi"
                    />
                    <span className="flex-none text-[13px] font-bold text-[var(--fg-muted)]">:</span>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={score.away}
                      onChange={(e) => setScore({ ...score, away: e.target.value })}
                      className={`${inputCls} text-center`}
                      aria-label="Mehmonlar hisobi"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={score.status}
                      onChange={(e) => setScore({ ...score, status: e.target.value as MatchStatus })}
                      className={`${inputCls} flex-1`}
                      aria-label="O'yin holati"
                    >
                      {statusOptions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    {score.status === "live" && (
                      <input
                        type="number"
                        min={0}
                        max={130}
                        value={score.minute}
                        onChange={(e) => setScore({ ...score, minute: e.target.value })}
                        className={`${inputCls} w-24 text-center`}
                        placeholder="daqiqa"
                        aria-label="Daqiqa"
                      />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setScoringId(null)}
                      className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--card)] py-2 text-[12px] font-semibold"
                    >
                      Bekor
                    </button>
                    <button
                      onClick={() => saveScore(m.id)}
                      disabled={saving}
                      className="flex-1 rounded-xl py-2 text-[12px] font-bold text-[#06130B] disabled:opacity-60"
                      style={{ background: "linear-gradient(140deg,#2FD871,#128A48)" }}
                    >
                      {saving ? "..." : "Hisobni saqlash"}
                    </button>
                  </div>

                  {/* Gol mualliflari — «To'purarlar» ro'yxati shulardan hisoblanadi */}
                  <MatchEventsEditor
                    match={m}
                    players={players}
                    onError={(msg) => setToast({ msg, kind: "error" })}
                  />
                </div>
              ) : (
                <div className="mt-3 flex gap-2 border-t border-[var(--border)] pt-3">
                  <button
                    onClick={() => openScore(m)}
                    className="flex-1 rounded-xl border border-[rgba(47,216,113,0.25)] bg-[rgba(47,216,113,0.08)] py-2 text-[12px] font-bold text-[#3BE07C]"
                  >
                    Hisob
                  </button>
                  <button
                    onClick={() => openEdit(m)}
                    className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--card)] py-2 text-[12px] font-semibold"
                  >
                    Tahrirlash
                  </button>
                  <button
                    onClick={() => handleDelete(m)}
                    className="flex-none rounded-xl border border-[rgba(239,68,68,0.22)] bg-[rgba(239,68,68,0.1)] px-3 py-2 text-[12px] font-semibold text-[#F87171]"
                  >
                    O&apos;chirish
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Yaratish/tahrirlash formasi */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-5">
          <form
            onSubmit={handleSubmit}
            className="flex max-h-[88vh] w-full max-w-[430px] flex-col gap-2.5 overflow-y-auto rounded-t-[22px] border border-[var(--border)] bg-[#0E1512] p-5 sm:rounded-[22px]"
          >
            <div className="text-[15px] font-bold">
              {editingId === "new" ? "Yangi uchrashuv" : "Uchrashuvni tahrirlash"}
            </div>

            <Field label="Turnir">
              <select
                required
                value={form.tournament_id}
                onChange={(e) => setForm({ ...form, tournament_id: e.target.value })}
                className={inputCls}
              >
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Uy egalari">
                <select
                  required
                  value={form.home_team_id}
                  onChange={(e) => setForm({ ...form, home_team_id: e.target.value })}
                  className={inputCls}
                >
                  <option value="">Tanlang...</option>
                  {formTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Mehmonlar">
                <select
                  required
                  value={form.away_team_id}
                  onChange={(e) => setForm({ ...form, away_team_id: e.target.value })}
                  className={inputCls}
                >
                  <option value="">Tanlang...</option>
                  {formTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Boshlanish vaqti">
              <input
                required
                type="datetime-local"
                value={form.kickoff_at}
                onChange={(e) => setForm({ ...form, kickoff_at: e.target.value })}
                className={inputCls}
              />
            </Field>

            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Guruh (ixtiyoriy)">
                <input
                  value={form.group_name}
                  onChange={(e) => setForm({ ...form, group_name: e.target.value })}
                  placeholder="A"
                  className={inputCls}
                />
              </Field>
              <Field label="Holati">
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as MatchStatus })}
                  className={inputCls}
                >
                  {statusOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="O'yin joyi (ixtiyoriy)">
              <input
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                placeholder="Qibray markaziy stadioni"
                className={inputCls}
              />
            </Field>

            <label className="mt-1 flex cursor-pointer items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3.5 py-2.5">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                className="h-4 w-4 accent-[#2FD871]"
              />
              <span className="text-[12px]">
                Asosiy uchrashuv
                <span className="ml-1 text-[10.5px] text-[var(--fg-muted)]">
                  («O&apos;yin» sahifasida ko&apos;rsatiladi — faqat bittasi bo&apos;lishi mumkin)
                </span>
              </span>
            </label>

            {error && <div className="text-[11.5px] text-[#E8A0A0]">{error}</div>}

            <div className="mt-1 flex gap-2.5">
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--card)] py-2.5 text-[13px] font-semibold"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-xl py-2.5 text-[13px] font-bold text-[#06130B] disabled:opacity-60"
                style={{ background: "linear-gradient(140deg,#2FD871,#128A48)" }}
              >
                {saving ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </div>
          </form>
        </div>
      )}

      {toast && <Toast message={toast.msg} kind={toast.kind} onDone={() => setToast(null)} />}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3.5 py-2.5 text-[13px] text-[var(--fg)] outline-none focus:border-[rgba(47,216,113,0.5)]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10.5px] font-semibold text-[var(--fg-muted)]">{label}</span>
      {children}
    </label>
  );
}
