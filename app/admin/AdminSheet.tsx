"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PillTabs } from "@/components/ui";
import { XIcon } from "@/components/icons";
import type { Team, Tournament, News, Sponsor, AppSettings, Profile } from "@/lib/types";
import { TournamentsPanel } from "./TournamentsPanel";
import { TeamsPanel } from "./TeamsPanel";
import { NewsPanel } from "./NewsPanel";
import { SponsorsPanel } from "./SponsorsPanel";
import { SettingsPanel } from "./SettingsPanel";
import { CoachesPanel } from "./CoachesPanel";
import { NotificationsBell } from "./NotificationsBell";

type AdminTabId = "turnirlar" | "jamoalar" | "murabbiylar" | "yangiliklar" | "homiylar" | "sozlamalar";

const adminTabs: { id: AdminTabId; label: string }[] = [
  { id: "turnirlar", label: "Turnirlar" },
  { id: "jamoalar", label: "Jamoalar" },
  { id: "murabbiylar", label: "Murabbiylar" },
  { id: "yangiliklar", label: "Yangiliklar" },
  { id: "homiylar", label: "Homiylar" },
  { id: "sozlamalar", label: "Sozlamalar" },
];

/** BottomNav'dagi "+" tugmasidan ochiladigan slide-up admin paneli (super_admin uchun). */
export function AdminSheet({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<AdminTabId>("turnirlar");
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    Promise.all([
      supabase.from("tournaments").select("*").order("starts_on", { ascending: false }),
      supabase.from("teams").select("*").order("name", { ascending: true }),
      supabase.from("news").select("*").order("published_at", { ascending: false }),
      supabase.from("sponsors").select("*").order("sort_order", { ascending: true }),
      supabase.from("app_settings").select("*").limit(1).maybeSingle(),
      supabase
        .from("profiles")
        .select("*, team:teams(*)")
        .not("user_id", "is", null)
        .neq("role", "super_admin")
        .order("full_name", { ascending: true }),
    ]).then(([t, tm, n, sp, st, u]) => {
      if (!active) return;
      setTournaments((t.data ?? []) as Tournament[]);
      setTeams((tm.data ?? []) as Team[]);
      setNews((n.data ?? []) as News[]);
      setSponsors((sp.data ?? []) as Sponsor[]);
      setSettings((st.data ?? null) as AppSettings | null);
      setUsers((u.data ?? []) as Profile[]);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-t-[28px] border border-[var(--border)] bg-[#0B0F0C] p-5 sm:rounded-[28px]"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-[17px] font-extrabold tracking-tight">Admin panel</h1>
          <div className="flex items-center gap-2">
            <NotificationsBell onNavigate={() => setTab("jamoalar")} />
            <button
              onClick={onClose}
              aria-label="Yopish"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--card)] text-[var(--fg)] transition hover:bg-[var(--bg-soft)]"
            >
              <XIcon size={16} />
            </button>
          </div>
        </div>

        <PillTabs tabs={adminTabs} active={tab} onChange={setTab} />

        {loading ? (
          <div className="py-8 text-center text-[12px] text-[var(--fg-muted)]">Yuklanmoqda...</div>
        ) : (
          <>
            {tab === "turnirlar" && <TournamentsPanel initialTournaments={tournaments} />}
            {tab === "jamoalar" && <TeamsPanel initialTeams={teams} tournaments={tournaments} coaches={users} />}
            {tab === "murabbiylar" && <CoachesPanel initialUsers={users} teams={teams} />}
            {tab === "yangiliklar" && <NewsPanel initialNews={news} />}
            {tab === "homiylar" && <SponsorsPanel initialSponsors={sponsors} />}
            {tab === "sozlamalar" && <SettingsPanel initialSettings={settings} />}
          </>
        )}
      </div>
    </div>
  );
}
