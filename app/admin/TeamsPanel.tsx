"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createTeam, updateTeam, deleteTeam, approveTeam, rejectTeam, assignTeamToTournament } from "@/lib/actions/teams";
import type { Team, Tournament, Profile, Player } from "@/lib/types";
import { Crest } from "@/components/ui";
import { PlusIcon } from "@/components/icons";
import { Toast } from "@/components/Toast";
import { slugify } from "@/lib/format";

type FormState = {
  slug: string;
  name: string;
  init: string;
  crest_gradient: string;
  crest_border: string;
  crest_color: string;
  coach_email: string;
  tournament_id: string;
};

const emptyForm: FormState = {
  slug: "",
  name: "",
  init: "",
  crest_gradient: "linear-gradient(140deg,#2FD871,#128A48)",
  crest_border: "rgba(255,255,255,0.15)",
  crest_color: "#fff",
  coach_email: "",
  tournament_id: "",
};

export function TeamsPanel({
  initialTeams,
  tournaments,
  coaches = [],
}: {
  initialTeams: Team[];
  tournaments: Tournament[];
  coaches?: Profile[];
}) {
  const [items, setItems] = useState(initialTeams);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; kind: "success" | "error" } | null>(null);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [rosterModalTeam, setRosterModalTeam] = useState<Team | null>(null);
  const [assignTournamentId, setAssignTournamentId] = useState<Record<string, string>>({});

  const pendingTeams = items.filter((t) => t.status === "pending");
  const coachName = (userId: string | null) => coaches.find((c) => c.user_id === userId)?.full_name ?? "Noma'lum";

  // Turnir ichida nom to'qnashuvini real-vaqtda ko'rsatish (400ms debounce) —
  // bu faqat maslahat/ogohlantirish, haqiqiy tekshiruv har doim serverda (trigger orqali).
  const [nameConflict, setNameConflict] = useState(false);
  const [checkingName, setCheckingName] = useState(false);

  useEffect(() => {
    const name = form.name.trim();
    const tournamentId = form.tournament_id;
    if (!name || !tournamentId) {
      setNameConflict(false);
      return;
    }
    setCheckingName(true);
    const timer = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("standings")
        .select("team_id, team:teams(name)")
        .eq("tournament_id", tournamentId);
      const currentId = editingId !== "new" ? editingId : null;
      const conflict = (data ?? []).some(
        (row) =>
          row.team_id !== currentId &&
          (row.team as unknown as { name: string } | null)?.name?.trim().toLowerCase() === name.toLowerCase()
      );
      setNameConflict(conflict);
      setCheckingName(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [form.name, form.tournament_id, editingId]);

  // Yangi jamoa yaratilayotganda slug nomdan avtomatik hosil bo'ladi — foydalanuvchi
  // slug maydonini qo'lda tahrirlasa, avtomatik yangilanish shu forma sessiyasi uchun to'xtaydi.
  const [slugTouched, setSlugTouched] = useState(false);

  function openCreate() {
    setForm(emptyForm);
    setError(null);
    setSlugTouched(false);
    setEditingId("new");
  }

  function openEdit(t: Team) {
    setForm({
      slug: t.slug,
      name: t.name,
      init: t.init,
      crest_gradient: t.crest_gradient,
      crest_border: t.crest_border,
      crest_color: t.crest_color,
      coach_email: t.coach_email ?? "",
      tournament_id: "",
    });
    setError(null);
    setSlugTouched(true);
    setEditingId(t.id);
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
      slug: form.slug.trim(),
      name: form.name.trim(),
      init: form.init.trim(),
      crest_gradient: form.crest_gradient.trim(),
      crest_border: form.crest_border.trim(),
      crest_color: form.crest_color.trim(),
      coach_email: form.coach_email.trim(),
    };
    const tournamentId = form.tournament_id || undefined;

    const result =
      editingId === "new" ? await createTeam(payload, tournamentId) : await updateTeam(editingId, payload, tournamentId);

    if (result.error) {
      setError(result.error);
      setToast({ msg: result.error, kind: "error" });
    } else {
      if (editingId === "new") setItems((prev) => [result.data as Team, ...prev]);
      else setItems((prev) => prev.map((t) => (t.id === editingId ? (result.data as Team) : t)));
      setToast({ msg: "Saqlandi", kind: "success" });
      setEditingId(null);
    }
    setSaving(false);
  }

  async function handleDelete(t: Team) {
    if (!window.confirm(`"${t.name}" jamoasini o'chirasizmi? Boshqa o'yin/jadvallarda ishlatilgan bo'lsa xatolik chiqishi mumkin.`))
      return;
    const result = await deleteTeam(t.id);
    if (result.error) {
      setToast({ msg: result.error, kind: "error" });
      return;
    }
    setItems((prev) => prev.filter((x) => x.id !== t.id));
    setToast({ msg: "O'chirildi", kind: "success" });
  }

  async function handleApprove(t: Team) {
    setPendingActionId(t.id);
    const result = await approveTeam(t.id);
    if (result.error) setToast({ msg: result.error, kind: "error" });
    else {
      setItems((prev) => prev.map((x) => (x.id === t.id ? (result.data as Team) : x)));
      setToast({ msg: "Jamoa tasdiqlandi", kind: "success" });
    }
    setPendingActionId(null);
  }

  async function handleReject(t: Team) {
    if (!window.confirm(`"${t.name}" jamoasini rad etasizmi?`)) return;
    setPendingActionId(t.id);
    const result = await rejectTeam(t.id);
    if (result.error) setToast({ msg: result.error, kind: "error" });
    else {
      setItems((prev) => prev.map((x) => (x.id === t.id ? (result.data as Team) : x)));
      setToast({ msg: "Jamoa rad etildi", kind: "success" });
    }
    setPendingActionId(null);
  }

  async function handleAssignTournament(t: Team) {
    const tournamentId = assignTournamentId[t.id];
    if (!tournamentId) return;
    setPendingActionId(t.id);
    const result = await assignTeamToTournament(t.id, tournamentId);
    if (result.error) setToast({ msg: result.error, kind: "error" });
    else setToast({ msg: "Turnirga qo'shildi", kind: "success" });
    setPendingActionId(null);
  }

  return (
    <div className="flex flex-col gap-3">
      {pendingTeams.length > 0 && (
        <div className="flex flex-col gap-2 rounded-[16px] border border-[rgba(245,194,75,0.3)] bg-[rgba(245,194,75,0.06)] p-3">
          <div className="text-[12px] font-extrabold text-[#F5C24B]">
            Tasdiqlash kutilmoqda · {pendingTeams.length}
          </div>
          {pendingTeams.map((t) => (
            <div key={t.id} className="flex items-center gap-3 rounded-[14px] border border-white/[0.07] bg-white/[0.04] px-3.5 py-2.5">
              <Crest gradient={t.crest_gradient} init={t.init} border={t.crest_border} color={t.crest_color} size={32} fontSize={10} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] font-bold">{t.name}</div>
                <div className="mt-0.5 truncate text-[10px] text-[rgba(237,244,239,0.45)]">
                  Murabbiy: {coachName(t.created_by)}
                </div>
              </div>
              <button
                onClick={() => setRosterModalTeam(t)}
                className="rounded-lg border border-white/[0.1] bg-white/[0.05] px-2.5 py-1.5 text-[10.5px] font-semibold"
              >
                Ko&apos;rish
              </button>
              <button
                onClick={() => handleApprove(t)}
                disabled={pendingActionId === t.id}
                className="rounded-lg px-2.5 py-1.5 text-[10.5px] font-bold text-[#06130B] disabled:opacity-60"
                style={{ background: "#2FD871" }}
              >
                Tasdiqlash
              </button>
              <button
                onClick={() => handleReject(t)}
                disabled={pendingActionId === t.id}
                className="rounded-lg border border-[rgba(220,90,90,0.4)] bg-[rgba(220,90,90,0.1)] px-2.5 py-1.5 text-[10.5px] font-semibold text-[#E8A0A0] disabled:opacity-60"
              >
                Rad etish
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-[13px] font-bold">{items.length} ta jamoa</div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold text-[#06130B]"
          style={{ background: "linear-gradient(140deg,#2FD871,#128A48)" }}
        >
          <PlusIcon size={14} />
          Yangi jamoa
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className="flex flex-col gap-2.5 rounded-[16px] border border-white/[0.07] bg-white/[0.04] px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <Crest gradient={t.crest_gradient} init={t.init} border={t.crest_border} color={t.crest_color} size={36} fontSize={11} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-bold">{t.name}</div>
                <div className="mt-0.5 truncate text-[10.5px] text-[rgba(237,244,239,0.45)]">
                  {t.coach_email ? `Murabbiy: ${t.coach_email}` : "Murabbiy biriktirilmagan"}
                </div>
              </div>
              {t.status !== "approved" && (
                <span
                  className="flex-shrink-0 rounded-full px-2 py-1 text-[9.5px] font-extrabold"
                  style={{
                    background: t.status === "pending" ? "rgba(245,194,75,.14)" : "rgba(239,68,68,.14)",
                    color: t.status === "pending" ? "#F5C24B" : "#F87171",
                  }}
                >
                  {t.status === "pending" ? "Kutilmoqda" : "Rad etilgan"}
                </span>
              )}
              <button
                onClick={() => openEdit(t)}
                className="rounded-lg border border-white/[0.1] bg-white/[0.05] px-3 py-1.5 text-[11px] font-semibold"
              >
                Tahrirlash
              </button>
              <button
                onClick={() => handleDelete(t)}
                className="rounded-lg border border-[rgba(220,90,90,0.4)] bg-[rgba(220,90,90,0.1)] px-3 py-1.5 text-[11px] font-semibold text-[#E8A0A0]"
              >
                O&apos;chirish
              </button>
            </div>

            {t.status === "approved" && (
              <div className="flex gap-2">
                <select
                  value={assignTournamentId[t.id] ?? ""}
                  onChange={(e) => setAssignTournamentId((prev) => ({ ...prev, [t.id]: e.target.value }))}
                  className="flex-1 rounded-lg border border-white/[0.1] bg-white/[0.05] px-2.5 py-1.5 text-[11.5px] text-[#EDF4EF] outline-none"
                >
                  <option value="">Turnir tanlang...</option>
                  {tournaments.map((tr) => (
                    <option key={tr.id} value={tr.id}>
                      {tr.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleAssignTournament(t)}
                  disabled={pendingActionId === t.id || !assignTournamentId[t.id]}
                  className="rounded-lg px-3 py-1.5 text-[11px] font-bold text-[#06130B] disabled:opacity-60"
                  style={{ background: "linear-gradient(140deg,#2FD871,#128A48)" }}
                >
                  Turnirga qo&apos;shish
                </button>
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.03] p-6 text-center text-sm text-[rgba(237,244,239,0.45)]">
            Hozircha jamoalar yo'q
          </div>
        )}
      </div>

      {editingId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center">
          <form
            onSubmit={handleSubmit}
            className="flex max-h-[85vh] w-full max-w-md flex-col gap-3 overflow-y-auto rounded-t-[24px] border border-white/[0.08] bg-[#0B0F0C] p-5 sm:rounded-[24px]"
          >
            <div className="text-[15px] font-bold">{editingId === "new" ? "Yangi jamoa" : "Jamoani tahrirlash"}</div>

            <div className="flex items-center justify-center py-1">
              <Crest gradient={form.crest_gradient} init={form.init || "?"} border={form.crest_border} color={form.crest_color} size={64} fontSize={22} />
            </div>

            <Field label="Turnir (ixtiyoriy — nom shu turnir ichida tekshiriladi)">
              <select
                value={form.tournament_id}
                onChange={(e) => setForm({ ...form, tournament_id: e.target.value })}
                className={inputCls}
              >
                <option value="">Bog'lamasdan saqlash</option>
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Nomi">
              <input
                required
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
                }}
                className={inputCls}
              />
              {form.tournament_id && form.name.trim() && (
                <div className="mt-1 text-[11px]" style={{ color: nameConflict ? "#E8A0A0" : "rgba(237,244,239,0.4)" }}>
                  {checkingName
                    ? "Tekshirilmoqda..."
                    : nameConflict
                      ? "Bu turnirda shunday nomli jamoa allaqachon mavjud"
                      : "Nom shu turnirda band emas"}
                </div>
              )}
            </Field>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Slug">
                <input
                  required
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setForm({ ...form, slug: e.target.value });
                  }}
                  className={inputCls}
                />
              </Field>
              <Field label="Qisqartma (init)">
                <input
                  required
                  maxLength={3}
                  value={form.init}
                  onChange={(e) => setForm({ ...form, init: e.target.value.toUpperCase() })}
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="Gerb gradienti (CSS)">
              <input
                required
                value={form.crest_gradient}
                onChange={(e) => setForm({ ...form, crest_gradient: e.target.value })}
                className={inputCls}
              />
            </Field>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Chegara rangi">
                <input
                  required
                  value={form.crest_border}
                  onChange={(e) => setForm({ ...form, crest_border: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Matn rangi">
                <input
                  required
                  value={form.crest_color}
                  onChange={(e) => setForm({ ...form, crest_color: e.target.value })}
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="Murabbiy Email-i (Google account, ixtiyoriy)">
              <input
                type="email"
                placeholder="murabbiy@gmail.com"
                value={form.coach_email}
                onChange={(e) => setForm({ ...form, coach_email: e.target.value })}
                className={inputCls}
              />
            </Field>

            {error && <div className="text-[11.5px] text-[#E8A0A0]">{error}</div>}

            <div className="mt-1 flex gap-2.5">
              <button
                type="button"
                onClick={closeForm}
                className="flex-1 rounded-xl border border-white/[0.1] bg-white/[0.05] py-2.5 text-[13px] font-semibold"
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

      {rosterModalTeam && (
        <RosterViewModal team={rosterModalTeam} onClose={() => setRosterModalTeam(null)} />
      )}

      {toast && <Toast message={toast.msg} kind={toast.kind} onDone={() => setToast(null)} />}
    </div>
  );
}

function RosterViewModal({ team, onClose }: { team: Team; onClose: () => void }) {
  const [players, setPlayers] = useState<Player[] | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    supabase
      .from("players")
      .select("*")
      .eq("team_id", team.id)
      .order("number", { ascending: true })
      .then(({ data }) => {
        if (active) setPlayers((data ?? []) as Player[]);
      });
    return () => {
      active = false;
    };
  }, [team.id]);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[75vh] w-full max-w-md flex-col gap-3 overflow-y-auto rounded-t-[24px] border border-white/[0.08] bg-[#0B0F0C] p-5 sm:rounded-[24px]"
      >
        <div className="text-[15px] font-bold">{team.name} — tarkib</div>
        {players === null ? (
          <div className="py-6 text-center text-[12px] text-[rgba(237,244,239,0.45)]">Yuklanmoqda...</div>
        ) : players.length === 0 ? (
          <div className="py-6 text-center text-[12px] text-[rgba(237,244,239,0.45)]">Hali o&apos;yinchi qo&apos;shilmagan</div>
        ) : (
          <div className="flex flex-col gap-2">
            {players.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-[12px] border border-white/[0.07] bg-white/[0.04] px-3 py-2">
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-white/[0.06] text-[11px] font-extrabold">
                  {p.number}
                </span>
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold">{p.name}</span>
                <span className="text-[10.5px] text-[rgba(237,244,239,0.45)]">{p.position}</span>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={onClose}
          className="rounded-xl border border-white/[0.1] bg-white/[0.05] py-2.5 text-[13px] font-semibold"
        >
          Yopish
        </button>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-3.5 py-2.5 text-[13px] text-[#EDF4EF] outline-none focus:border-[rgba(47,216,113,0.5)]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10.5px] font-semibold text-[rgba(237,244,239,0.5)]">{label}</span>
      {children}
    </label>
  );
}
