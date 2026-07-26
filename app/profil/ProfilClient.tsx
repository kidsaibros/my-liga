"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { Screen } from "@/components/Screen";
import { Crest, Badge } from "@/components/ui";
import { HelpSheet } from "./HelpSheet";
import { FavoritesSheet } from "./FavoritesSheet";
import { SettingsSheet } from "./SettingsSheet";
import { signInWithGoogle, logout } from "@/lib/actions/auth";
import {
  SunIcon,
  MoonIcon,
  HelpIcon,
  StarIcon,
  SettingsIcon,
  ShieldIcon,
  ChartIcon,
  ChevronRightIcon,
  LogOutIcon,
} from "@/components/icons";
import type { AppSettings, Profile } from "@/lib/types";

const roleBadge: Record<Profile["role"], { label: string; tone: "gold" | "emerald" | "gray" }> = {
  super_admin: { label: "Super Admin", tone: "gold" },
  coach: { label: "Murabbiy", tone: "emerald" },
  user: { label: "Muxlis", tone: "gray" },
};

type SheetId = "help" | "favorites" | "settings" | null;

export function ProfilClient({
  email,
  profile: initialProfile,
  settings,
}: {
  email: string | null;
  profile: Profile | null;
  settings: AppSettings | null;
}) {
  const [profile, setProfile] = useState(initialProfile);
  const [openSheet, setOpenSheet] = useState<SheetId>(null);

  // Sessiya bor, lekin profil qatori yaratilmagan — bu "kirmagan" holat emas,
  // syncProfileRole() server tomonda xato bergani belgisi (masalan, xizmat kaliti yo'q).
  if (email && !profile) {
    return (
      <Screen>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl"
            style={{ background: "rgba(239,68,68,0.12)", color: "#F87171" }}
          >
            !
          </div>
          <div>
            <div className="text-[17px] font-extrabold">Profil yaratilmadi</div>
            <div className="mt-1 text-[12.5px]" style={{ color: "var(--fg-soft)" }}>
              {email} bilan kirdingiz, lekin profil ma&apos;lumotlarini saqlashda server xatoligi yuz berdi.
              Odatda sabab — SUPABASE_SERVICE_ROLE_KEY sozlanmagan. Server terminalidagi xatoni tekshiring.
            </div>
          </div>
          <form action={logout} className="w-full max-w-xs">
            <button
              type="submit"
              className="w-full rounded-xl border py-3 text-[13px] font-bold"
              style={{ borderColor: "var(--border)", background: "var(--card)", color: "var(--fg)" }}
            >
              Chiqish va qayta urinish
            </button>
          </form>
        </div>
      </Screen>
    );
  }

  if (!email || !profile) {
    return (
      <Screen>
        <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-10 text-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-extrabold"
            style={{ background: "linear-gradient(140deg,#22C55E,#0E9F6E)", color: "#062016" }}
          >
            ML
          </div>
          <div>
            <div className="text-[17px] font-extrabold">MY LIGA&apos;ga xush kelibsiz</div>
            <div className="mt-1 text-[12.5px]" style={{ color: "var(--fg-soft)" }}>
              Profilingizni ko&apos;rish uchun Google hisobingiz bilan kiring
            </div>
          </div>

          <form action={signInWithGoogle} className="w-full max-w-xs">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border py-3 text-[13.5px] font-bold"
              style={{ borderColor: "var(--border)", background: "var(--card)", color: "var(--fg)" }}
            >
              <GoogleLogo />
              Google orqali kirish
            </button>
          </form>
        </div>
      </Screen>
    );
  }

  const badge = roleBadge[profile.role];
  const stats = [
    { label: "O'yinlar", value: profile.matches_played ?? 0, href: "/oyin" },
    { label: "Gollar", value: profile.goals ?? 0, href: "/statistika" },
    { label: "Assist", value: profile.assists ?? 0, href: "/statistika" },
  ];

  function patchProfile(patch: Partial<Profile>) {
    setProfile((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  return (
    <Screen>
      <div className="flex flex-col items-center gap-4 px-5 pt-6 pb-6">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt={profile.full_name}
            width={88}
            height={88}
            className="h-[88px] w-[88px] rounded-full object-cover"
            style={{ border: "1px solid var(--border)", boxShadow: "0 0 34px rgba(14,159,110,0.25)" }}
          />
        ) : (
          <Crest
            gradient={profile.team?.crest_gradient ?? "linear-gradient(140deg,#22C55E,#0E9F6E)"}
            init={profile.full_name.slice(0, 1).toUpperCase()}
            size={88}
            fontSize={32}
            color="#062016"
            border="transparent"
            glow="0 0 34px rgba(14,159,110,0.35)"
          />
        )}

        <div className="text-center">
          <div className="text-xl font-extrabold tracking-tight">{profile.full_name}</div>
          <div className="mt-1 text-xs" style={{ color: "var(--fg-soft)" }}>
            {email}
          </div>
          <div className="mt-2 flex justify-center">
            <Badge tone={badge.tone}>{badge.label}</Badge>
          </div>
        </div>

        {profile.role === "super_admin" && (
          <Link
            href="/admin"
            className="flex w-full items-center justify-center rounded-xl py-3 text-[13.5px] font-bold"
            style={{ background: "linear-gradient(120deg,#22C55E,#0E9F6E)", color: "#062016" }}
          >
            Admin Panel
          </Link>
        )}

        <div className="grid w-full grid-cols-3 gap-2.5">
          {stats.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className="flex flex-col items-center gap-1 rounded-[18px] border py-4 transition-opacity hover:opacity-80"
              style={{ borderColor: "var(--border)", background: "var(--card)" }}
            >
              <div className="text-2xl font-extrabold" style={{ color: "#0E9F6E" }}>
                {s.value}
              </div>
              <div className="text-[10.5px]" style={{ color: "var(--fg-muted)" }}>
                {s.label}
              </div>
            </Link>
          ))}
        </div>

        <div className="flex w-full flex-col gap-2">
          <ThemeMenuRow />
          <MenuRow icon={<HelpIcon size={17} />} label="Yordam" onClick={() => setOpenSheet("help")} />
          <MenuRow icon={<StarIcon size={17} />} label="Sevimlilar" onClick={() => setOpenSheet("favorites")} />
          <MenuRow icon={<SettingsIcon size={17} />} label="Sozlamalar" onClick={() => setOpenSheet("settings")} />

          {profile.role === "coach" && (
            <Link href="/coach" className="block">
              <MenuRow icon={<ShieldIcon size={17} />} label="Mening Jamoam" as="div" />
            </Link>
          )}
          {profile.team_id && (
            <Link href="/oyin" className="block">
              <MenuRow icon={<ChartIcon size={17} />} label="Mening O'yinlarim" as="div" />
            </Link>
          )}
        </div>

        <form action={logout} className="w-full">
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

      {openSheet === "help" && <HelpSheet settings={settings} onClose={() => setOpenSheet(null)} />}
      {openSheet === "favorites" && profile.user_id && (
        <FavoritesSheet userId={profile.user_id} onClose={() => setOpenSheet(null)} />
      )}
      {openSheet === "settings" && (
        <SettingsSheet profile={profile} onClose={() => setOpenSheet(null)} onUpdated={patchProfile} />
      )}
    </Screen>
  );
}

function MenuRow({
  icon,
  label,
  onClick,
  as = "button",
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  as?: "button" | "div";
}) {
  const Comp = as === "button" ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left"
      style={{ borderColor: "var(--border)", background: "var(--card)", color: "var(--fg)" }}
    >
      <span
        className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px]"
        style={{ background: "rgba(14,159,110,0.12)", color: "#0E9F6E" }}
      >
        {icon}
      </span>
      <span className="flex-1 text-[13.5px] font-semibold">{label}</span>
      <ChevronRightIcon size={16} style={{ color: "var(--fg-muted)" }} />
    </Comp>
  );
}

function ThemeMenuRow() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left"
      style={{ borderColor: "var(--border)", background: "var(--card)", color: "var(--fg)" }}
    >
      <span
        className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px]"
        style={{ background: "rgba(14,159,110,0.12)", color: "#0E9F6E" }}
      >
        {isDark ? <MoonIcon size={16} /> : <SunIcon size={17} />}
      </span>
      <span className="flex-1 text-[13.5px] font-semibold">Mavzu</span>
      <span className="text-[12px]" style={{ color: "var(--fg-muted)" }}>
        {isDark ? "Qorong'i" : "Yorug'"}
      </span>
      <span
        role="switch"
        aria-checked={isDark}
        className="relative h-[24px] w-[42px] flex-none rounded-full transition-colors"
        style={{ background: isDark ? "#0E9F6E" : "var(--border)" }}
      >
        <span
          className="absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white transition-transform"
          style={{ left: 3, transform: isDark ? "translateX(18px)" : "translateX(0)" }}
        />
      </span>
    </button>
  );
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.5 0 10.4-2.1 14.1-5.6l-6.5-5.5C29.6 34.6 26.9 35.5 24 35.5c-5.3 0-9.7-3.4-11.3-8.1l-6.6 5.1C9.6 39.6 16.3 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.5l6.5 5.5C41.4 35.9 44 30.4 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  );
}
