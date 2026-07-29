"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PillTabs } from "@/components/ui";
import { BackIcon } from "@/components/icons";
import type { Match, Player, Team, Tournament, News, Sponsor, AppSettings, Profile } from "@/lib/types";
import { TournamentsPanel } from "./TournamentsPanel";
import { MatchesPanel } from "./MatchesPanel";
import { TeamsPanel } from "./TeamsPanel";
import { NewsPanel } from "./NewsPanel";
import { SponsorsPanel } from "./SponsorsPanel";
import { SettingsPanel } from "./SettingsPanel";
import { CoachesPanel } from "./CoachesPanel";
import { NotificationsBell } from "./NotificationsBell";

type AdminTabId =
  | "turnirlar"
  | "oyinlar"
  | "jamoalar"
  | "murabbiylar"
  | "yangiliklar"
  | "homiylar"
  | "sozlamalar";

const adminTabs: { id: AdminTabId; label: string }[] = [
  { id: "turnirlar", label: "Turnirlar" },
  { id: "oyinlar", label: "O'yinlar" },
  { id: "jamoalar", label: "Jamoalar" },
  { id: "murabbiylar", label: "Murabbiylar" },
  { id: "yangiliklar", label: "Yangiliklar" },
  { id: "homiylar", label: "Homiylar" },
  { id: "sozlamalar", label: "Sozlamalar" },
];

export function AdminClient({
  tournaments,
  matches,
  teams,
  players,
  news,
  sponsors,
  settings,
  users,
}: {
  tournaments: Tournament[];
  matches: Match[];
  teams: Team[];
  players: Player[];
  news: News[];
  sponsors: Sponsor[];
  settings: AppSettings | null;
  users: Profile[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<AdminTabId>("turnirlar");

  return (
    <div className="app-scroll flex flex-col gap-4 px-5 pt-3 pb-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/")}
          className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-[var(--card)] text-[var(--fg)] transition hover:bg-[var(--bg-soft)]"
        >
          <BackIcon size={16} />
        </button>
        <h1 className="flex-1 text-[22px] font-extrabold tracking-tight">Admin panel</h1>
        <NotificationsBell onNavigate={() => setTab("jamoalar")} />
      </div>

      <PillTabs tabs={adminTabs} active={tab} onChange={setTab} />

      {tab === "turnirlar" && <TournamentsPanel initialTournaments={tournaments} />}
      {tab === "oyinlar" && (
        <MatchesPanel
          initialMatches={matches}
          tournaments={tournaments}
          teams={teams}
          players={players}
        />
      )}
      {tab === "jamoalar" && <TeamsPanel initialTeams={teams} tournaments={tournaments} coaches={users} />}
      {tab === "murabbiylar" && <CoachesPanel initialUsers={users} teams={teams} />}
      {tab === "yangiliklar" && <NewsPanel initialNews={news} />}
      {tab === "homiylar" && <SponsorsPanel initialSponsors={sponsors} />}
      {tab === "sozlamalar" && <SettingsPanel initialSettings={settings} />}
    </div>
  );
}
