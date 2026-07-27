"use client";

import { useRef, useState } from "react";
import { Sheet } from "@/components/ui";
import { Avatar } from "@/components/Avatar";
import { CameraIcon } from "@/components/icons";
import { updateFullName, updateNotificationPrefs, uploadAvatar } from "@/lib/actions/profile";
import type { Profile } from "@/lib/types";

export function SettingsSheet({
  profile,
  onClose,
  onUpdated,
}: {
  profile: Profile;
  onClose: () => void;
  onUpdated: (patch: Partial<Profile>) => void;
}) {
  const [name, setName] = useState(profile.full_name);
  const [savingName, setSavingName] = useState(false);
  const [nameMsg, setNameMsg] = useState<string | null>(null);

  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [push, setPush] = useState(profile.push_enabled);
  const [email, setEmail] = useState(profile.email_enabled);
  const [savingPrefs, setSavingPrefs] = useState(false);

  async function handleNameSave() {
    setSavingName(true);
    setNameMsg(null);
    const result = await updateFullName(name);
    if (result.error !== null) {
      setNameMsg(result.error);
    } else {
      setNameMsg("Saqlandi");
      onUpdated({ full_name: result.data.full_name });
    }
    setSavingName(false);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setAvatarError(null);
    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadAvatar(formData);
    if (result.error !== null) {
      setAvatarError(result.error);
    } else {
      setAvatarUrl(result.data.avatar_url);
      onUpdated({ avatar_url: result.data.avatar_url });
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handlePrefsToggle(nextPush: boolean, nextEmail: boolean) {
    setPush(nextPush);
    setEmail(nextEmail);
    setSavingPrefs(true);
    await updateNotificationPrefs(nextPush, nextEmail);
    onUpdated({ push_enabled: nextPush, email_enabled: nextEmail });
    setSavingPrefs(false);
  }

  return (
    <Sheet title="Sozlamalar" onClose={onClose}>
      <div className="flex flex-col gap-5 pb-2">
        <div className="flex flex-col items-center gap-2.5">
          <div className="relative">
            <Avatar url={avatarUrl} name={name} size={80} glow="none" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 disabled:opacity-60"
              style={{ background: "#0E9F6E", color: "#fff", borderColor: "var(--card)" }}
            >
              <CameraIcon size={15} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          {uploading && (
            <div className="text-[11px]" style={{ color: "var(--fg-muted)" }}>
              Yuklanmoqda...
            </div>
          )}
          {avatarError && <div className="text-[11px] text-[#F87171]">{avatarError}</div>}
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[10.5px] font-semibold" style={{ color: "var(--fg-soft)" }}>
            Ism-familiya
          </span>
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 rounded-xl border px-3.5 py-2.5 text-[13px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--bg-soft)", color: "var(--fg)" }}
            />
            <button
              type="button"
              onClick={handleNameSave}
              disabled={savingName || !name.trim()}
              className="rounded-xl px-4 text-[12.5px] font-bold disabled:opacity-60"
              style={{ background: "#0E9F6E", color: "#fff" }}
            >
              {savingName ? "..." : "Saqlash"}
            </button>
          </div>
          {nameMsg && (
            <div className="text-[11px]" style={{ color: nameMsg === "Saqlandi" ? "#0E9F6E" : "#F87171" }}>
              {nameMsg}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          <span className="text-[10.5px] font-semibold" style={{ color: "var(--fg-soft)" }}>
            Bildirishnomalar
          </span>
          <ToggleRow
            label="Push bildirishnomalar"
            checked={push}
            disabled={savingPrefs}
            onChange={(v) => handlePrefsToggle(v, email)}
          />
          <ToggleRow
            label="Email bildirishnomalar"
            checked={email}
            disabled={savingPrefs}
            onChange={(v) => handlePrefsToggle(push, v)}
          />
        </div>
      </div>
    </Sheet>
  );
}

function ToggleRow({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className="flex items-center justify-between rounded-2xl border px-4 py-3 disabled:opacity-60"
      style={{ borderColor: "var(--border)", background: "var(--bg-soft)" }}
    >
      <span className="text-[13px] font-semibold">{label}</span>
      <span
        role="switch"
        aria-checked={checked}
        className="relative h-[26px] w-[46px] flex-none rounded-full transition-colors"
        style={{ background: checked ? "#0E9F6E" : "var(--border)" }}
      >
        <span
          className="absolute top-[3px] h-5 w-5 rounded-full bg-white transition-transform"
          style={{ left: 3, transform: checked ? "translateX(20px)" : "translateX(0)" }}
        />
      </span>
    </button>
  );
}
