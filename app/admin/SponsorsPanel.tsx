"use client";

import { useState } from "react";
import { createSponsor, updateSponsor, deleteSponsor } from "@/lib/actions/sponsors";
import type { Sponsor } from "@/lib/types";
import { PlusIcon } from "@/components/icons";
import { Toast } from "@/components/Toast";

type FormState = {
  name: string;
  logo_url: string;
  link_url: string;
  is_featured: boolean;
  sort_order: string;
};

function emptyForm(nextOrder: number): FormState {
  return { name: "", logo_url: "", link_url: "", is_featured: false, sort_order: String(nextOrder) };
}

/** Admin panel — Bosh sahifadagi homiylar banneri uchun CRUD (sponsors jadvali). */
export function SponsorsPanel({ initialSponsors }: { initialSponsors: Sponsor[] }) {
  const [items, setItems] = useState(
    [...initialSponsors].sort((a, b) => a.sort_order - b.sort_order)
  );
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm(0));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; kind: "success" | "error" } | null>(null);

  function openCreate() {
    setForm(emptyForm(items.length));
    setError(null);
    setEditingId("new");
  }

  function openEdit(s: Sponsor) {
    setForm({
      name: s.name,
      logo_url: s.logo_url ?? "",
      link_url: s.link_url ?? "",
      is_featured: s.is_featured,
      sort_order: String(s.sort_order),
    });
    setError(null);
    setEditingId(s.id);
  }

  function closeForm() {
    setEditingId(null);
    setError(null);
  }

  function resort(list: Sponsor[]) {
    return [...list].sort((a, b) => a.sort_order - b.sort_order);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name: form.name.trim(),
      logo_url: form.logo_url.trim(),
      link_url: form.link_url.trim(),
      is_featured: form.is_featured,
      sort_order: form.sort_order.trim(),
    };

    const result = editingId === "new" ? await createSponsor(payload) : await updateSponsor(editingId, payload);

    if (result.error) {
      setError(result.error);
      setToast({ msg: result.error, kind: "error" });
    } else {
      if (editingId === "new") setItems((prev) => resort([result.data as Sponsor, ...prev]));
      else setItems((prev) => resort(prev.map((s) => (s.id === editingId ? (result.data as Sponsor) : s))));
      setToast({ msg: "Saqlandi", kind: "success" });
      setEditingId(null);
    }
    setSaving(false);
  }

  async function handleDelete(s: Sponsor) {
    if (!window.confirm(`"${s.name}" homiysini o'chirasizmi?`)) return;
    const result = await deleteSponsor(s.id);
    if (result.error) {
      setToast({ msg: result.error, kind: "error" });
      return;
    }
    setItems((prev) => prev.filter((x) => x.id !== s.id));
    setToast({ msg: "O'chirildi", kind: "success" });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-[13px] font-bold">{items.length} ta homiy</div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold text-[#06130B]"
          style={{ background: "linear-gradient(140deg,#2FD871,#128A48)" }}
        >
          <PlusIcon size={14} />
          Yangi homiy
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {items.map((s) => (
          <div
            key={s.id}
            className="flex items-center gap-3 rounded-[16px] border border-white/[0.07] bg-white/[0.04] px-4 py-3"
          >
            <div
              className="flex h-9 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-[10px] text-[10px] font-extrabold text-white"
              style={{ background: s.logo_url ? undefined : "linear-gradient(140deg,#2FD871,#128A48)" }}
            >
              {s.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.logo_url} alt={s.name} className="h-full w-full object-cover" />
              ) : (
                s.name.slice(0, 4).toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-bold">{s.name}</div>
              <div className="mt-0.5 truncate text-[10.5px] text-[rgba(237,244,239,0.45)]">
                {s.is_featured ? "Faol banner" : `Tartib: ${s.sort_order}`}
              </div>
            </div>
            <button
              onClick={() => openEdit(s)}
              className="rounded-lg border border-white/[0.1] bg-white/[0.05] px-3 py-1.5 text-[11px] font-semibold"
            >
              Tahrirlash
            </button>
            <button
              onClick={() => handleDelete(s)}
              className="rounded-lg border border-[rgba(220,90,90,0.4)] bg-[rgba(220,90,90,0.1)] px-3 py-1.5 text-[11px] font-semibold text-[#E8A0A0]"
            >
              O'chirish
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.03] p-6 text-center text-sm text-[rgba(237,244,239,0.45)]">
            Hozircha homiylar yo&apos;q — Bosh sahifadagi banner statik ko&apos;rinishda qoladi
          </div>
        )}
      </div>

      {editingId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center">
          <form
            onSubmit={handleSubmit}
            className="flex max-h-[85vh] w-full max-w-md flex-col gap-3 overflow-y-auto rounded-t-[24px] border border-white/[0.08] bg-[#0B0F0C] p-5 sm:rounded-[24px]"
          >
            <div className="text-[15px] font-bold">{editingId === "new" ? "Yangi homiy" : "Homiyni tahrirlash"}</div>

            <Field label="Homiy nomi">
              <input
                required
                placeholder="Masalan: ARTEL"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Reklama rasmi (URL)">
              <input
                placeholder="https://.../banner.jpg"
                value={form.logo_url}
                onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Havola (link)">
              <input
                placeholder="https://homiy.uz"
                value={form.link_url}
                onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                className={inputCls}
              />
            </Field>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Tartib raqami">
                <input
                  type="number"
                  min={0}
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <label className="flex flex-col gap-1.5">
                <span className="text-[10.5px] font-semibold text-[rgba(237,244,239,0.5)]">Ko&apos;rinishi</span>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_featured: !form.is_featured })}
                  className="flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.05] px-3.5 py-2.5 text-[13px]"
                >
                  <span
                    className="h-4 w-4 rounded-[4px] border border-white/20"
                    style={{ background: form.is_featured ? "#2FD871" : "transparent" }}
                  />
                  Faol banner
                </button>
              </label>
            </div>

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

      {toast && <Toast message={toast.msg} kind={toast.kind} onDone={() => setToast(null)} />}
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
