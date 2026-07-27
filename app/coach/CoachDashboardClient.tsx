"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { createRosterPlayer, updateRosterPlayer, deleteRosterPlayer } from "@/lib/actions/roster";
import { saveLineup } from "@/lib/actions/lineup";
import { createPlayer, updatePlayer, deletePlayer } from "@/lib/actions/players";
import { logout } from "@/lib/actions/auth";
import { Crest, PillTabs } from "@/components/ui";
import { PlusIcon, StarIcon, BackIcon } from "@/components/icons";
import { Toast } from "@/components/Toast";
import { ImageUpload } from "@/components/ImageUpload";
import type { Team, PlayerStat, Player, Lineup, PlayerPosition, Formation, Tournament } from "@/lib/types";

const FORMATIONS: Formation[] = ["4-3-3", "4-4-2", "4-2-3-1", "3-5-2", "3-4-3"];
const FORMATION_SLOTS: Record<Formation, Record<PlayerPosition, number>> = {
  "4-3-3": { GK: 1, DEF: 4, MID: 3, FWD: 3 },
  "4-4-2": { GK: 1, DEF: 4, MID: 4, FWD: 2 },
  "4-2-3-1": { GK: 1, DEF: 4, MID: 5, FWD: 1 },
  "3-5-2": { GK: 1, DEF: 3, MID: 5, FWD: 2 },
  "3-4-3": { GK: 1, DEF: 3, MID: 4, FWD: 3 },
};
const POSITION_LABEL: Record<PlayerPosition, string> = {
  GK: "Darvozabon",
  DEF: "Himoyachi",
  MID: "Yarim himoyachi",
  FWD: "Hujumchi",
};

type CoachTabId = "tarkib" | "taktika" | "statistika" | "turnirlar";

const STATUS_BANNER: Record<Team["status"], { bg: string; color: string; text: string } | null> = {
  pending: {
    bg: "rgba(245,194,75,.12)",
    color: "#F5C24B",
    text: "Jamoangiz Super Admin tasdiqlashini kutmoqda. Shu bilan birga tarkibni to'ldirishda davom etishingiz mumkin.",
  },
  rejected: {
    bg: "rgba(239,68,68,.12)",
    color: "#F87171",
    text: "Jamoangiz rad etildi. Savollar bo'lsa, Super Admin bilan bog'laning.",
  },
  approved: null,
};

export function CoachDashboardClient({ team, coachName }: { team: Team; coachName: string }) {
  const teamId = team.id;
  const coachTabs: { id: CoachTabId; label: string }[] = [
    { id: "tarkib", label: "Tarkib" },
    { id: "taktika", label: "Taktika" },
    { id: "statistika", label: "Statistika" },
    ...(team.status === "approved" ? [{ id: "turnirlar" as const, label: "Turnirlar" }] : []),
  ];
  const [tab, setTab] = useState<CoachTabId>("tarkib");
  const [loading, setLoading] = useState(true);
  const [roster, setRoster] = useState<Player[]>([]);
  const [lineup, setLineup] = useState<Lineup | null>(null);
  const [stats, setStats] = useState<PlayerStat[]>([]);
  const [toast, setToast] = useState<{ msg: string; kind: "success" | "error" } | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    Promise.all([
      supabase.from("players").select("*").eq("team_id", teamId).order("number", { ascending: true }),
      supabase.from("lineups").select("*").eq("team_id", teamId).maybeSingle(),
      supabase.from("player_stats").select("*, team:teams(*)").eq("team_id", teamId).order("goals", { ascending: false }),
    ]).then(([r, l, s]) => {
      if (!active) return;
      setRoster((r.data ?? []) as Player[]);
      setLineup((l.data ?? null) as Lineup | null);
      setStats((s.data ?? []) as PlayerStat[]);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [teamId]);

  function notify(msg: string, kind: "success" | "error" = "success") {
    setToast({ msg, kind });
  }

  return (
    <div className="app-scroll flex flex-col gap-4 px-5 pt-3 pb-6" style={{ background: "var(--bg)", minHeight: "100%" }}>
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-xl"
          style={{ background: "var(--bg-soft)", color: "var(--fg)" }}
        >
          <BackIcon size={16} />
        </Link>
        <Crest gradient={team.crest_gradient} init={team.init} border={team.crest_border} color={team.crest_color} size={40} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[16px] font-extrabold">{team.name}</div>
          <div className="truncate text-[11px]" style={{ color: "var(--fg-muted)" }}>
            Murabbiy: {coachName}
          </div>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-lg border px-3 py-1.5 text-[11px] font-semibold"
            style={{ borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#F87171" }}
          >
            Chiqish
          </button>
        </form>
      </div>

      {STATUS_BANNER[team.status] && (
        <div
          className="rounded-[14px] px-4 py-3 text-[12px] font-semibold"
          style={{ background: STATUS_BANNER[team.status]!.bg, color: STATUS_BANNER[team.status]!.color }}
        >
          {STATUS_BANNER[team.status]!.text}
        </div>
      )}

      <PillTabs tabs={coachTabs} active={tab} onChange={setTab} />

      {loading ? (
        <div className="py-8 text-center text-[12px]" style={{ color: "var(--fg-muted)" }}>
          Yuklanmoqda...
        </div>
      ) : (
        <>
          {tab === "tarkib" && <RosterTab teamId={teamId} roster={roster} setRoster={setRoster} notify={notify} />}
          {tab === "taktika" && (
            <TaktikaTab teamId={teamId} roster={roster} lineup={lineup} setLineup={setLineup} notify={notify} />
          )}
          {tab === "statistika" && <StatistikaTab teamId={teamId} stats={stats} setStats={setStats} notify={notify} />}
          {tab === "turnirlar" && <TournamentsReadOnlyTab teamId={teamId} />}
        </>
      )}

      {toast && <Toast message={toast.msg} kind={toast.kind} onDone={() => setToast(null)} />}
    </div>
  );
}

// ── Tarkib (Roster + foto) ───────────────────────────────────────────────────

type RosterForm = { number: string; name: string; position: PlayerPosition; photo_url: string };
const emptyRosterForm: RosterForm = { number: "", name: "", position: "MID", photo_url: "" };

function RosterTab({
  teamId,
  roster,
  setRoster,
  notify,
}: {
  teamId: string;
  roster: Player[];
  setRoster: React.Dispatch<React.SetStateAction<Player[]>>;
  notify: (msg: string, kind?: "success" | "error") => void;
}) {
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<RosterForm>(emptyRosterForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setForm(emptyRosterForm);
    setError(null);
    setEditingId("new");
  }
  function openEdit(p: Player) {
    setForm({ number: String(p.number), name: p.name, position: p.position, photo_url: p.photo_url ?? "" });
    setError(null);
    setEditingId(p.id);
  }
  function closeForm() {
    setEditingId(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const existing = editingId !== "new" ? roster.find((p) => p.id === editingId) : undefined;
    const payload = {
      team_id: teamId,
      number: form.number,
      name: form.name.trim(),
      position: form.position,
      photo_url: form.photo_url.trim(),
      is_starter: existing?.is_starter ?? false,
    };

    const result = editingId === "new" ? await createRosterPlayer(payload) : await updateRosterPlayer(editingId, payload);

    if (result.error !== null) {
      setError(result.error);
      notify(result.error, "error");
    } else {
      if (editingId === "new") setRoster((prev) => [...prev, result.data].sort((a, b) => a.number - b.number));
      else setRoster((prev) => prev.map((p) => (p.id === editingId ? result.data : p)));
      notify("Saqlandi");
      setEditingId(null);
    }
    setSaving(false);
  }

  async function handleDelete(p: Player) {
    if (!window.confirm(`"${p.name}"ni tarkibdan o'chirasizmi?`)) return;
    const result = await deleteRosterPlayer(p.id);
    if (result.error) {
      notify(result.error, "error");
      return;
    }
    setRoster((prev) => prev.filter((x) => x.id !== p.id));
    notify("O'chirildi");
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-[13px] font-bold">{roster.length} ta o'yinchi</div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold text-[#062016]"
          style={{ background: "linear-gradient(120deg,#22C55E,#0E9F6E)" }}
        >
          <PlusIcon size={14} />
          O&apos;yinchi qo&apos;shish
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {roster.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-3 rounded-[16px] border px-4 py-3"
            style={{ borderColor: "var(--border)", background: "var(--card)" }}
          >
            {p.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.photo_url} alt={p.name} className="h-10 w-10 flex-shrink-0 rounded-full object-cover" />
            ) : (
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-extrabold"
                style={{
                  background: p.is_starter ? "rgba(14,159,110,.16)" : "var(--bg-soft)",
                  color: p.is_starter ? "#0E9F6E" : "var(--fg)",
                }}
              >
                {p.number}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-bold">{p.name}</div>
              <div className="mt-0.5 text-[10.5px]" style={{ color: "var(--fg-muted)" }}>
                #{p.number} · {POSITION_LABEL[p.position]} {p.is_starter && "· Asosiy tarkibda"}
              </div>
            </div>
            <button
              onClick={() => openEdit(p)}
              className="rounded-lg border px-3 py-1.5 text-[11px] font-semibold"
              style={{ borderColor: "var(--border)", background: "var(--bg-soft)" }}
            >
              Tahrirlash
            </button>
            <button
              onClick={() => handleDelete(p)}
              className="rounded-lg border px-3 py-1.5 text-[11px] font-semibold"
              style={{ borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#F87171" }}
            >
              O&apos;chirish
            </button>
          </div>
        ))}
        {roster.length === 0 && (
          <div
            className="rounded-[16px] border p-6 text-center text-sm"
            style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}
          >
            Hozircha o&apos;yinchilar yo&apos;q
          </div>
        )}
      </div>

      {editingId && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" onClick={closeForm}>
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85vh] w-full max-w-md flex-col gap-3 overflow-y-auto rounded-t-[24px] p-5 sm:rounded-[24px]"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div className="text-[15px] font-bold">{editingId === "new" ? "Yangi o'yinchi" : "O'yinchini tahrirlash"}</div>

            <div className="flex items-center justify-center py-1">
              {form.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.photo_url} alt="" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-extrabold"
                  style={{ background: "linear-gradient(120deg,#22C55E,#0E9F6E)", color: "#062016" }}
                >
                  {form.number || "?"}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Raqami">
                <input required type="number" min={0} max={99} value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Pozitsiya">
                <select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value as PlayerPosition })} className={inputCls}>
                  {(Object.keys(POSITION_LABEL) as PlayerPosition[]).map((pos) => (
                    <option key={pos} value={pos}>
                      {pos} — {POSITION_LABEL[pos]}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Ism-familiya">
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
            </Field>
            <ImageUpload
              label="Fotosurat (ixtiyoriy)"
              category="player"
              shape="circle"
              value={form.photo_url || null}
              onChange={(url) => setForm({ ...form, photo_url: url })}
              hint="JPG, PNG yoki WEBP · 5 MB gacha"
            />

            {error && <div className="text-[11.5px] text-[#F87171]">{error}</div>}

            <div className="mt-1 flex gap-2.5">
              <button type="button" onClick={closeForm} className="flex-1 rounded-xl border py-2.5 text-[13px] font-semibold" style={{ borderColor: "var(--border)" }}>
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-xl py-2.5 text-[13px] font-bold text-[#062016] disabled:opacity-60"
                style={{ background: "linear-gradient(120deg,#22C55E,#0E9F6E)" }}
              >
                {saving ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ── Taktika ───────────────────────────────────────────────────────────────

function TaktikaTab({
  teamId,
  roster,
  lineup,
  setLineup,
  notify,
}: {
  teamId: string;
  roster: Player[];
  lineup: Lineup | null;
  setLineup: React.Dispatch<React.SetStateAction<Lineup | null>>;
  notify: (msg: string, kind?: "success" | "error") => void;
}) {
  const [formation, setFormation] = useState<Formation>(lineup?.formation ?? "4-3-3");
  const [captainId, setCaptainId] = useState<string | null>(lineup?.captain_player_id ?? null);
  const [localRoster, setLocalRoster] = useState(roster);
  const [saving, setSaving] = useState(false);

  useEffect(() => setLocalRoster(roster), [roster]);

  const slots = FORMATION_SLOTS[formation];
  const starters = localRoster.filter((p) => p.is_starter);
  const bench = localRoster.filter((p) => !p.is_starter);
  const countByPos = (pos: PlayerPosition) => starters.filter((p) => p.position === pos).length;

  async function toggleStarter(p: Player) {
    const willStart = !p.is_starter;
    if (willStart && countByPos(p.position) >= slots[p.position]) {
      notify(`${formation} sxemasida faqat ${slots[p.position]} ta ${POSITION_LABEL[p.position]} bo'lishi mumkin`, "error");
      return;
    }
    const result = await updateRosterPlayer(p.id, {
      team_id: teamId,
      number: p.number,
      name: p.name,
      position: p.position,
      photo_url: p.photo_url ?? "",
      is_starter: willStart,
    });
    if (result.error !== null) {
      notify(result.error, "error");
      return;
    }
    setLocalRoster((prev) => prev.map((x) => (x.id === p.id ? result.data : x)));
    if (!willStart && captainId === p.id) setCaptainId(null);
  }

  async function handleSaveLineup() {
    setSaving(true);
    const result = await saveLineup({ team_id: teamId, formation, captain_player_id: captainId });
    if (result.error) notify(result.error, "error");
    else {
      setLineup(result.data);
      notify("Taktik sxema saqlandi");
    }
    setSaving(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-[10.5px] font-semibold" style={{ color: "var(--fg-soft)" }}>
          Formatsiya
        </span>
        <div className="flex flex-wrap gap-2">
          {FORMATIONS.map((f) => (
            <button
              key={f}
              onClick={() => setFormation(f)}
              className="rounded-full px-3.5 py-2 text-xs font-bold"
              style={{
                background: f === formation ? "linear-gradient(120deg,#22C55E,#0E9F6E)" : "var(--bg-soft)",
                color: f === formation ? "#062016" : "var(--fg-soft)",
                border: `1px solid ${f === formation ? "transparent" : "var(--border)"}`,
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-[14px] border px-4 py-3" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
        <span className="text-[12.5px] font-semibold">Asosiy tarkib</span>
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-extrabold"
          style={{
            background: starters.length === 11 ? "rgba(14,159,110,.16)" : "rgba(245,194,75,.16)",
            color: starters.length === 11 ? "#0E9F6E" : "#F5C24B",
          }}
        >
          {starters.length}/11
        </span>
      </div>

      {(Object.keys(POSITION_LABEL) as PlayerPosition[]).map((pos) => (
        <div key={pos} className="flex flex-col gap-2">
          <div className="text-[10.5px] font-bold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>
            {POSITION_LABEL[pos]} · {countByPos(pos)}/{slots[pos]}
          </div>
          {localRoster
            .filter((p) => p.position === pos)
            .map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-[14px] border px-3.5 py-2.5"
                style={{
                  borderColor: p.is_starter ? "rgba(14,159,110,.35)" : "var(--border)",
                  background: p.is_starter ? "rgba(14,159,110,.06)" : "var(--card)",
                }}
              >
                <button
                  onClick={() => toggleStarter(p)}
                  className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-[11px] font-extrabold"
                  style={{ background: p.is_starter ? "#0E9F6E" : "var(--bg-soft)", color: p.is_starter ? "#fff" : "var(--fg)" }}
                >
                  {p.number}
                </button>
                <div className="min-w-0 flex-1 truncate text-[12.5px] font-semibold">{p.name}</div>
                {p.is_starter && (
                  <button onClick={() => setCaptainId(p.id)} aria-label="Kapitan" style={{ color: captainId === p.id ? "#F5C24B" : "var(--fg-muted)" }}>
                    <StarIcon size={17} filled={captainId === p.id} />
                  </button>
                )}
              </div>
            ))}
          {localRoster.filter((p) => p.position === pos).length === 0 && (
            <div className="text-[11px]" style={{ color: "var(--fg-muted)" }}>
              Bu pozitsiyada o&apos;yinchi yo&apos;q
            </div>
          )}
        </div>
      ))}

      {bench.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="text-[10.5px] font-bold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>
            Zaxira · {bench.length}
          </div>
          {bench.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-[14px] border px-3.5 py-2.5" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-[11px] font-extrabold" style={{ background: "var(--bg-soft)" }}>
                {p.number}
              </span>
              <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold">{p.name}</span>
              <button onClick={() => toggleStarter(p)} className="text-[11px] font-bold" style={{ color: "#0E9F6E" }}>
                Asosiyga
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleSaveLineup}
        disabled={saving}
        className="rounded-xl py-2.5 text-[13px] font-bold text-[#062016] disabled:opacity-60"
        style={{ background: "linear-gradient(120deg,#22C55E,#0E9F6E)" }}
      >
        {saving ? "Saqlanmoqda..." : "Taktik sxemani saqlash"}
      </button>
    </div>
  );
}

// ── Turnirlar (read-only — biriktirishni faqat admin qiladi) ───────────────

function TournamentsReadOnlyTab({ teamId }: { teamId: string }) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    supabase
      .from("standings")
      .select("tournament:tournaments(*)")
      .eq("team_id", teamId)
      .then(({ data }) => {
        if (!active) return;
        setTournaments(
          ((data ?? []) as unknown as { tournament: Tournament }[]).map((r) => r.tournament).filter(Boolean)
        );
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [teamId]);

  if (loading) {
    return (
      <div className="py-8 text-center text-[12px]" style={{ color: "var(--fg-muted)" }}>
        Yuklanmoqda...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="text-[10.5px] font-bold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>
        Ishtirok etayotgan turnirlar · {tournaments.length}
      </div>
      {tournaments.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-3 rounded-[14px] border px-3.5 py-3"
          style={{ borderColor: "var(--border)", background: "var(--card)" }}
        >
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-bold">{t.name}</div>
            <div className="mt-0.5 text-[10.5px]" style={{ color: "var(--fg-muted)" }}>
              {t.dates_label}
            </div>
          </div>
        </div>
      ))}
      {tournaments.length === 0 && (
        <div className="rounded-[14px] border p-6 text-center text-sm" style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}>
          Hozircha birorta turnirga qo&apos;shilmagansiz — buni Super Admin amalga oshiradi
        </div>
      )}
    </div>
  );
}

// ── Statistika ───────────────────────────────────────────────────────────

type StatForm = { player_name: string; goals: string; assists: string };
const emptyStatForm: StatForm = { player_name: "", goals: "0", assists: "0" };

function StatistikaTab({
  teamId,
  stats,
  setStats,
  notify,
}: {
  teamId: string;
  stats: PlayerStat[];
  setStats: React.Dispatch<React.SetStateAction<PlayerStat[]>>;
  notify: (msg: string, kind?: "success" | "error") => void;
}) {
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<StatForm>(emptyStatForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setForm(emptyStatForm);
    setError(null);
    setEditingId("new");
  }
  function openEdit(p: PlayerStat) {
    setForm({ player_name: p.player_name, goals: String(p.goals), assists: String(p.assists) });
    setError(null);
    setEditingId(p.id);
  }
  function closeForm() {
    setEditingId(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      player_name: form.player_name.trim(),
      team_id: teamId,
      goals: Number(form.goals) || 0,
      assists: Number(form.assists) || 0,
    };

    const result = editingId === "new" ? await createPlayer(payload) : await updatePlayer(editingId, payload);

    if (result.error !== null) {
      setError(result.error);
      notify(result.error, "error");
    } else {
      if (editingId === "new") setStats((prev) => [result.data, ...prev]);
      else setStats((prev) => prev.map((x) => (x.id === editingId ? result.data : x)));
      notify("Saqlandi");
      setEditingId(null);
    }
    setSaving(false);
  }

  async function handleDelete(p: PlayerStat) {
    if (!window.confirm(`"${p.player_name}"ni o'chirasizmi?`)) return;
    const result = await deletePlayer(p.id);
    if (result.error) {
      notify(result.error, "error");
      return;
    }
    setStats((prev) => prev.filter((x) => x.id !== p.id));
    notify("O'chirildi");
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={openCreate}
        className="flex items-center gap-1.5 self-start rounded-full px-3.5 py-2 text-xs font-bold text-[#062016]"
        style={{ background: "linear-gradient(120deg,#22C55E,#0E9F6E)" }}
      >
        <PlusIcon size={14} />
        Statistika qo&apos;shish
      </button>

      <div className="flex flex-col gap-2">
        {stats.map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-[16px] border px-4 py-3" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-bold">{p.player_name}</div>
              <div className="mt-0.5 text-[10.5px]" style={{ color: "var(--fg-muted)" }}>
                {p.goals} gol · {p.assists} pas
              </div>
            </div>
            <button onClick={() => openEdit(p)} className="rounded-lg border px-3 py-1.5 text-[11px] font-semibold" style={{ borderColor: "var(--border)", background: "var(--bg-soft)" }}>
              Tahrirlash
            </button>
            <button
              onClick={() => handleDelete(p)}
              className="rounded-lg border px-3 py-1.5 text-[11px] font-semibold"
              style={{ borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#F87171" }}
            >
              O&apos;chirish
            </button>
          </div>
        ))}
        {stats.length === 0 && (
          <div className="rounded-[16px] border p-6 text-center text-sm" style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}>
            Hozircha statistika yo&apos;q
          </div>
        )}
      </div>

      {editingId && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" onClick={closeForm}>
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-md flex-col gap-3 rounded-t-[24px] p-5 sm:rounded-[24px]"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div className="text-[15px] font-bold">{editingId === "new" ? "Yangi statistika" : "Statistikani tahrirlash"}</div>

            <Field label="Ism-familiya">
              <input required value={form.player_name} onChange={(e) => setForm({ ...form, player_name: e.target.value })} className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Gollar">
                <input required type="number" min={0} value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Pas (assist)">
                <input required type="number" min={0} value={form.assists} onChange={(e) => setForm({ ...form, assists: e.target.value })} className={inputCls} />
              </Field>
            </div>

            {error && <div className="text-[11.5px] text-[#F87171]">{error}</div>}

            <div className="mt-1 flex gap-2.5">
              <button type="button" onClick={closeForm} className="flex-1 rounded-xl border py-2.5 text-[13px] font-semibold" style={{ borderColor: "var(--border)" }}>
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-xl py-2.5 text-[13px] font-bold text-[#062016] disabled:opacity-60"
                style={{ background: "linear-gradient(120deg,#22C55E,#0E9F6E)" }}
              >
                {saving ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] px-3.5 py-2.5 text-[13px] text-[var(--fg)] outline-none focus:border-[#0E9F6E]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10.5px] font-semibold" style={{ color: "var(--fg-soft)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}
