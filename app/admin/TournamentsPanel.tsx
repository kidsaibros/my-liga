"use client";

import { useState } from "react";
import { createTournament, updateTournament, deleteTournament } from "@/lib/actions/tournaments";
import { addTeamToTournament, removeTeamFromTournament } from "@/lib/actions/tournament-teams";
import { createClient } from "@/lib/supabase/client";
import type { Tournament, TournamentStatus, Team } from "@/lib/types";
import { PlusIcon } from "@/components/icons";
import { Toast } from "@/components/Toast";
import { slugify } from "@/lib/format";

const statusOptions: { id: TournamentStatus; label: string }[] = [
  { id: "faol", label: "Faol" },
  { id: "yakunlangan", label: "Yakunlangan" },
  { id: "kelajakdagi", label: "Kelajakdagi" },
];

const formatOptions: { id: "liga" | "kubok"; label: string }[] = [
  { id: "liga", label: "Liga" },
  { id: "kubok", label: "Kubok" },
];

type FormState = {
  slug: string;
  name: string;
  dates_label: string;
  starts_on: string;
  ends_on: string;
  team_count: string;
  status: TournamentStatus;
  format: "liga" | "kubok";
  regulations: string;
};

const emptyForm: FormState = {
  slug: "",
  name: "",
  dates_label: "",
  starts_on: "",
  ends_on: "",
  team_count: "0",
  status: "faol",
  format: "liga",
  regulations: "",
};

export function TournamentsPanel({
  initialTournaments,
  teams = [],
}: {
  initialTournaments: Tournament[];
  teams?: Team[];
}) {
  const [items, setItems] = useState(initialTournaments);
  // Liga a'zoligi editori
  const [memberFor, setMemberFor] = useState<Tournament | null>(null);
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set());
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberBusy, setMemberBusy] = useState<string | null>(null);

  async function openMembers(t: Tournament) {
    setMemberFor(t);
    setMemberLoading(true);
    setMemberIds(new Set());
    const supabase = createClient();
    const { data } = await supabase.from("tournament_teams").select("team_id").eq("tournament_id", t.id);
    setMemberIds(new Set((data ?? []).map((r) => r.team_id as string)));
    setMemberLoading(false);
  }

  async function toggleMember(teamId: string) {
    if (!memberFor) return;
    setMemberBusy(teamId);
    const isMember = memberIds.has(teamId);
    const res = isMember
      ? await removeTeamFromTournament(memberFor.id, teamId)
      : await addTeamToTournament(memberFor.id, teamId);
    if (res.error === null) {
      setMemberIds((prev) => {
        const next = new Set(prev);
        if (isMember) next.delete(teamId);
        else next.add(teamId);
        return next;
      });
    } else {
      setToast({ msg: res.error, kind: "error" });
    }
    setMemberBusy(null);
  }
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; kind: "success" | "error" } | null>(null);
  // Yangi turnir yaratilayotganda slug nomdan avtomatik hosil bo'ladi — foydalanuvchi
  // slug maydonini qo'lda tahrirlasa, avtomatik yangilanish shu forma sessiyasi uchun to'xtaydi.
  const [slugTouched, setSlugTouched] = useState(false);

  function openCreate() {
    setForm(emptyForm);
    setError(null);
    setSlugTouched(false);
    setEditingId("new");
  }

  function openEdit(t: Tournament) {
    setForm({
      slug: t.slug,
      name: t.name,
      dates_label: t.dates_label,
      starts_on: t.starts_on,
      ends_on: t.ends_on,
      team_count: String(t.team_count),
      status: t.status,
      format: (t.format as "liga" | "kubok") ?? "liga",
      regulations: t.regulations ?? "",
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
      dates_label: form.dates_label.trim(),
      starts_on: form.starts_on,
      ends_on: form.ends_on,
      team_count: Number(form.team_count) || 0,
      status: form.status,
      format: form.format,
      regulations: form.regulations.trim(),
    };

    const result =
      editingId === "new" ? await createTournament(payload) : await updateTournament(editingId, payload);

    if (result.error) {
      setError(result.error);
      setToast({ msg: result.error, kind: "error" });
    } else {
      if (editingId === "new") setItems((prev) => [result.data as Tournament, ...prev]);
      else setItems((prev) => prev.map((t) => (t.id === editingId ? (result.data as Tournament) : t)));
      setToast({ msg: "Saqlandi", kind: "success" });
      setEditingId(null);
    }
    setSaving(false);
  }

  async function handleDelete(t: Tournament) {
    if (!window.confirm(`"${t.name}" turnirini o'chirasizmi? Bog'liq jadval va o'yinlar ham o'chadi.`)) return;
    const result = await deleteTournament(t.id);
    if (result.error) {
      setToast({ msg: result.error, kind: "error" });
      return;
    }
    setItems((prev) => prev.filter((x) => x.id !== t.id));
    setToast({ msg: "O'chirildi", kind: "success" });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-[13px] font-bold">{items.length} ta turnir</div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold text-[#06130B]"
          style={{ background: "linear-gradient(140deg,#2FD871,#128A48)" }}
        >
          <PlusIcon size={14} />
          Yangi turnir
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 rounded-[16px] border border-[var(--border)] bg-[var(--card)] px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-bold">{t.name}</div>
              <div className="mt-0.5 truncate text-[10.5px] text-[var(--fg-muted)]">
                {t.dates_label} · {t.team_count} ta jamoa · {t.status}
              </div>
            </div>
            <button
              onClick={() => openMembers(t)}
              className="rounded-lg border border-[rgba(47,216,113,0.3)] bg-[rgba(47,216,113,0.08)] px-3 py-1.5 text-[11px] font-semibold text-[#0E9F6E]"
            >
              Jamoalar
            </button>
            <button
              onClick={() => openEdit(t)}
              className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-[11px] font-semibold"
            >
              Tahrirlash
            </button>
            <button
              onClick={() => handleDelete(t)}
              className="rounded-lg border border-[rgba(220,90,90,0.4)] bg-[rgba(220,90,90,0.1)] px-3 py-1.5 text-[11px] font-semibold text-[#E8A0A0]"
            >
              O'chirish
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <div className="rounded-[16px] border border-[var(--border)] bg-[var(--card)] p-6 text-center text-sm text-[var(--fg-muted)]">
            Hozircha turnirlar yo'q
          </div>
        )}
      </div>

      {editingId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center">
          <form
            onSubmit={handleSubmit}
            className="flex max-h-[85vh] w-full max-w-md flex-col gap-3 overflow-y-auto rounded-t-[24px] border border-[var(--border)] bg-[#0B0F0C] p-5 sm:rounded-[24px]"
          >
            <div className="text-[15px] font-bold">
              {editingId === "new" ? "Yangi turnir" : "Turnirni tahrirlash"}
            </div>

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
            </Field>
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
            <Field label="Sana yorlig'i (masalan: 20 May – 10 Iyun 2024)">
              <input
                required
                value={form.dates_label}
                onChange={(e) => setForm({ ...form, dates_label: e.target.value })}
                className={inputCls}
              />
            </Field>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Boshlanish sanasi">
                <input
                  required
                  type="date"
                  value={form.starts_on}
                  onChange={(e) => setForm({ ...form, starts_on: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Tugash sanasi">
                <input
                  required
                  type="date"
                  value={form.ends_on}
                  onChange={(e) => setForm({ ...form, ends_on: e.target.value })}
                  className={inputCls}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Jamoalar soni">
                <input
                  required
                  type="number"
                  min={0}
                  value={form.team_count}
                  onChange={(e) => setForm({ ...form, team_count: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Holati">
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as TournamentStatus })}
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

            <Field label="Turi (liga jadval tizimida, kubok chiqib ketish)">
              <select
                value={form.format}
                onChange={(e) => setForm({ ...form, format: e.target.value as "liga" | "kubok" })}
                className={inputCls}
              >
                {formatOptions.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Reglament (har bir qoida — alohida qator)">
              <textarea
                rows={7}
                value={form.regulations}
                onChange={(e) => setForm({ ...form, regulations: e.target.value })}
                placeholder={"O'yin davomiyligi: 2 x 30 daqiqa.\nG'alaba 3 ochko, durang 1 ochko."}
                className={`${inputCls} resize-y leading-relaxed`}
              />
            </Field>

            {error && <div className="text-[11.5px] text-[#E8A0A0]">{error}</div>}

            <div className="mt-1 flex gap-2.5">
              <button
                type="button"
                onClick={closeForm}
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

      {memberFor && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
          onClick={() => setMemberFor(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85vh] w-full max-w-md flex-col gap-3 overflow-y-auto rounded-t-[24px] border border-[var(--border)] bg-[#0B0F0C] p-5 sm:rounded-[24px]"
          >
            <div className="text-[15px] font-bold">{memberFor.name} — jamoalar</div>
            <div className="text-[11px] text-[var(--fg-muted)]">
              Shu ligada qatnashadigan jamoalarni belgilang. O'yin qo'shishda faqat shular tanlanadi.
            </div>

            {memberLoading ? (
              <div className="py-6 text-center text-[12px] text-[var(--fg-muted)]">Yuklanmoqda...</div>
            ) : teams.length === 0 ? (
              <div className="py-6 text-center text-[12px] text-[var(--fg-muted)]">
                Avval &quot;Jamoalar&quot; bo&apos;limida jamoa qo&apos;shing
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {teams.map((tm) => {
                  const on = memberIds.has(tm.id);
                  return (
                    <button
                      key={tm.id}
                      type="button"
                      onClick={() => toggleMember(tm.id)}
                      disabled={memberBusy === tm.id}
                      className="flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-left disabled:opacity-60"
                      style={{
                        borderColor: on ? "rgba(47,216,113,0.5)" : "var(--border)",
                        background: on ? "rgba(47,216,113,0.08)" : "var(--card)",
                      }}
                    >
                      <span className="text-[13px] font-semibold">{tm.name}</span>
                      <span
                        className="text-[11px] font-bold"
                        style={{ color: on ? "#0E9F6E" : "var(--fg-muted)" }}
                      >
                        {memberBusy === tm.id ? "..." : on ? "A'zo ✓" : "Qo'shish"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={() => setMemberFor(null)}
              className="mt-1 rounded-xl border border-[var(--border)] bg-[var(--card)] py-2.5 text-[13px] font-semibold"
            >
              Yopish
            </button>
          </div>
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
