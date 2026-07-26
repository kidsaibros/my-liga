"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createOwnTeam, uploadTeamLogo } from "@/lib/actions/coach-team";
import { logout } from "@/lib/actions/auth";
import { CameraIcon, LogOutIcon } from "@/components/icons";

/** /coach — murabbiyning hali jamoasi yo'q holati: o'z jamoasini yaratish formasi. */
export function CreateTeamForm({ coachName }: { coachName: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameTaken, setNameTaken] = useState(false);
  const [checking, setChecking] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameTaken(false);
      return;
    }
    setChecking(true);
    const timer = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("teams")
        .select("id")
        .in("status", ["approved", "pending"])
        .ilike("name", trimmed)
        .limit(1);
      setNameTaken((data?.length ?? 0) > 0);
      setChecking(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [name]);

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadTeamLogo(formData);
    if (result.error !== null) setError(result.error);
    else setLogoUrl(result.data.logo_url);
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const result = await createOwnTeam({ name: name.trim(), logo_url: logoUrl ?? "" });
    if (result.error) {
      setError(result.error);
      setSaving(false);
      return;
    }
    router.refresh();
  }

  return (
    <div className="app-scroll flex flex-col gap-5 px-5 pt-8 pb-6" style={{ background: "var(--bg)", minHeight: "100%" }}>
      <div className="text-center">
        <div className="text-[17px] font-extrabold">Xush kelibsiz, {coachName}!</div>
        <div className="mt-1 text-[12.5px]" style={{ color: "var(--fg-soft)" }}>
          Murabbiy sifatida ishlashni boshlash uchun avval o&apos;z jamoangizni yarating
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-2.5">
          <div className="relative">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-20 w-20 rounded-full object-cover" style={{ border: "1px solid var(--border)" }} />
            ) : (
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full text-xl font-extrabold"
                style={{ background: "linear-gradient(120deg,#22C55E,#0E9F6E)", color: "#062016" }}
              >
                {name.slice(0, 1).toUpperCase() || "?"}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 disabled:opacity-60"
              style={{ background: "#0E9F6E", color: "#fff", borderColor: "var(--card)" }}
            >
              <CameraIcon size={15} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
          </div>
          {uploading && (
            <div className="text-[11px]" style={{ color: "var(--fg-muted)" }}>
              Yuklanmoqda...
            </div>
          )}
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[10.5px] font-semibold" style={{ color: "var(--fg-soft)" }}>
            Jamoa nomi
          </span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Masalan: Yoshlik FK"
            className="w-full rounded-xl border px-3.5 py-2.5 text-[13px] outline-none"
            style={{ borderColor: "var(--border)", background: "var(--bg-soft)", color: "var(--fg)" }}
          />
          {name.trim() && (
            <div className="text-[11px]" style={{ color: nameTaken ? "#F5C24B" : "var(--fg-muted)" }}>
              {checking ? "Tekshirilmoqda..." : nameTaken ? "Bu nom band bo'lishi mumkin — baribir davom etsangiz bo'ladi" : "Nom bo'sh"}
            </div>
          )}
        </label>

        {error && <div className="text-[11.5px] text-[#F87171]">{error}</div>}

        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="rounded-xl py-3 text-[13.5px] font-bold text-[#062016] disabled:opacity-60"
          style={{ background: "linear-gradient(120deg,#22C55E,#0E9F6E)" }}
        >
          {saving ? "Yaratilmoqda..." : "Jamoa yaratish"}
        </button>
      </form>

      <form action={logout} className="mt-auto">
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-[13px] font-bold"
          style={{ borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#F87171" }}
        >
          <LogOutIcon size={16} />
          Chiqish
        </button>
      </form>
    </div>
  );
}
