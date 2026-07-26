"use client";

import { useState } from "react";
import { updateAppSettings } from "@/lib/actions/settings";
import type { AppSettings } from "@/lib/types";
import { Toast } from "@/components/Toast";

type FormState = {
  app_name: string;
  system_status: string;
  telegram_support_url: string;
  phone_support: string;
};

function toForm(s: AppSettings | null): FormState {
  return {
    app_name: s?.app_name ?? "",
    system_status: s?.system_status ?? "",
    telegram_support_url: s?.telegram_support_url ?? "",
    phone_support: s?.phone_support ?? "",
  };
}

/** Admin panel — "Tizim sozlamalari": app_settings singleton qatorini tahrirlash. */
export function SettingsPanel({ initialSettings }: { initialSettings: AppSettings | null }) {
  const [settings, setSettings] = useState(initialSettings);
  const [form, setForm] = useState<FormState>(toForm(initialSettings));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; kind: "success" | "error" } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      app_name: form.app_name.trim(),
      system_status: form.system_status.trim(),
      telegram_support_url: form.telegram_support_url.trim(),
      phone_support: form.phone_support.trim(),
    };

    const result = await updateAppSettings(payload);

    if (result.error) {
      setError(result.error);
      setToast({ msg: result.error, kind: "error" });
    } else {
      setSettings(result.data as AppSettings);
      setForm(toForm(result.data as AppSettings));
      setToast({ msg: "Saqlandi", kind: "success" });
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="text-[13px] font-bold">Tizim sozlamalari</div>
      {settings?.updated_at && (
        <div className="text-[10.5px] text-[rgba(237,244,239,0.4)]">
          Oxirgi yangilanish: {new Date(settings.updated_at).toLocaleString("uz-UZ")}
        </div>
      )}

      <Field label="Ilova nomi">
        <input
          placeholder="MY LIGA"
          value={form.app_name}
          onChange={(e) => setForm({ ...form, app_name: e.target.value })}
          className={inputCls}
        />
      </Field>
      <Field label="Tizim holati">
        <input
          placeholder="Masalan: Faol"
          value={form.system_status}
          onChange={(e) => setForm({ ...form, system_status: e.target.value })}
          className={inputCls}
        />
      </Field>
      <Field label="Telegram (qo'llab-quvvatlash) havolasi">
        <input
          type="url"
          placeholder="https://t.me/myliga_support"
          value={form.telegram_support_url}
          onChange={(e) => setForm({ ...form, telegram_support_url: e.target.value })}
          className={inputCls}
        />
      </Field>
      <Field label="Telefon raqami">
        <input
          type="tel"
          placeholder="+998901234567"
          value={form.phone_support}
          onChange={(e) => setForm({ ...form, phone_support: e.target.value })}
          className={inputCls}
        />
      </Field>

      {error && <div className="text-[11.5px] text-[#E8A0A0]">{error}</div>}

      <button
        type="submit"
        disabled={saving}
        className="mt-1 rounded-xl py-2.5 text-[13px] font-bold text-[#06130B] disabled:opacity-60"
        style={{ background: "linear-gradient(140deg,#2FD871,#128A48)" }}
      >
        {saving ? "Saqlanmoqda..." : "Saqlash"}
      </button>

      {toast && <Toast message={toast.msg} kind={toast.kind} onDone={() => setToast(null)} />}
    </form>
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
