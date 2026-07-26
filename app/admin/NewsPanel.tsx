"use client";

import { useState } from "react";
import { createNews, updateNews, deleteNews } from "@/lib/actions/news";
import type { News } from "@/lib/types";
import { PlusIcon } from "@/components/icons";
import { Toast } from "@/components/Toast";

type FormState = {
  title: string;
  body: string;
  cover_gradient: string;
  published_at: string;
};

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function emptyForm(): FormState {
  return {
    title: "",
    body: "",
    cover_gradient: "linear-gradient(140deg,#2FD871,#128A48)",
    published_at: toLocalInput(new Date().toISOString()),
  };
}

export function NewsPanel({ initialNews }: { initialNews: News[] }) {
  const [items, setItems] = useState(initialNews);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; kind: "success" | "error" } | null>(null);

  function openCreate() {
    setForm(emptyForm());
    setError(null);
    setEditingId("new");
  }

  function openEdit(n: News) {
    setForm({
      title: n.title,
      body: n.body,
      cover_gradient: n.cover_gradient,
      published_at: toLocalInput(n.published_at),
    });
    setError(null);
    setEditingId(n.id);
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
      title: form.title.trim(),
      body: form.body.trim(),
      cover_gradient: form.cover_gradient.trim(),
      published_at: new Date(form.published_at).toISOString(),
    };

    const result = editingId === "new" ? await createNews(payload) : await updateNews(editingId, payload);

    if (result.error) {
      setError(result.error);
      setToast({ msg: result.error, kind: "error" });
    } else {
      if (editingId === "new") {
        setItems((prev) =>
          [result.data as News, ...prev].sort((a, b) => +new Date(b.published_at) - +new Date(a.published_at))
        );
      } else {
        setItems((prev) =>
          prev
            .map((n) => (n.id === editingId ? (result.data as News) : n))
            .sort((a, b) => +new Date(b.published_at) - +new Date(a.published_at))
        );
      }
      setToast({ msg: "Saqlandi", kind: "success" });
      setEditingId(null);
    }
    setSaving(false);
  }

  async function handleDelete(n: News) {
    if (!window.confirm(`"${n.title}" yangiligini o'chirasizmi?`)) return;
    const result = await deleteNews(n.id);
    if (result.error) {
      setToast({ msg: result.error, kind: "error" });
      return;
    }
    setItems((prev) => prev.filter((x) => x.id !== n.id));
    setToast({ msg: "O'chirildi", kind: "success" });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-[13px] font-bold">{items.length} ta yangilik</div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold text-[#06130B]"
          style={{ background: "linear-gradient(140deg,#2FD871,#128A48)" }}
        >
          <PlusIcon size={14} />
          Yangi post
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {items.map((n) => (
          <div
            key={n.id}
            className="flex items-center gap-3 rounded-[16px] border border-white/[0.07] bg-white/[0.04] px-4 py-3"
          >
            <div
              className="h-9 w-9 flex-shrink-0 rounded-[10px]"
              style={{ background: n.cover_gradient }}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-bold">{n.title}</div>
              <div className="mt-0.5 truncate text-[10.5px] text-[rgba(237,244,239,0.45)]">
                {new Date(n.published_at).toLocaleString("uz-UZ")}
              </div>
            </div>
            <button
              onClick={() => openEdit(n)}
              className="rounded-lg border border-white/[0.1] bg-white/[0.05] px-3 py-1.5 text-[11px] font-semibold"
            >
              Tahrirlash
            </button>
            <button
              onClick={() => handleDelete(n)}
              className="rounded-lg border border-[rgba(220,90,90,0.4)] bg-[rgba(220,90,90,0.1)] px-3 py-1.5 text-[11px] font-semibold text-[#E8A0A0]"
            >
              O'chirish
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.03] p-6 text-center text-sm text-[rgba(237,244,239,0.45)]">
            Hozircha yangiliklar yo'q
          </div>
        )}
      </div>

      {editingId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center">
          <form
            onSubmit={handleSubmit}
            className="flex max-h-[85vh] w-full max-w-md flex-col gap-3 overflow-y-auto rounded-t-[24px] border border-white/[0.08] bg-[#0B0F0C] p-5 sm:rounded-[24px]"
          >
            <div className="text-[15px] font-bold">{editingId === "new" ? "Yangi post" : "Postni tahrirlash"}</div>

            <Field label="Sarlavha">
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Matn">
              <textarea
                required
                rows={4}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Muqova gradienti (CSS)">
              <input
                required
                value={form.cover_gradient}
                onChange={(e) => setForm({ ...form, cover_gradient: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Chop etilgan sana">
              <input
                required
                type="datetime-local"
                value={form.published_at}
                onChange={(e) => setForm({ ...form, published_at: e.target.value })}
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
