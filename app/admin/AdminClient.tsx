"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PillTabs } from "@/components/ui";
import { BackIcon } from "@/components/icons";
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

export function AdminClient({
  tournaments,
  teams,
  news,
  sponsors,
  settings,
  users,
}: {
  tournaments: Tournament[];
  teams: Team[];
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
          className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-white/[0.08] text-[#EDF4EF] transition hover:bg-white/[0.16]"
        >
          <BackIcon size={16} />
        </button>
        <h1 className="flex-1 text-[22px] font-extrabold tracking-tight">Admin panel</h1>
        <NotificationsBell onNavigate={() => setTab("jamoalar")} />
      </div>

      <PillTabs tabs={adminTabs} active={tab} onChange={setTab} />

      {tab === "turnirlar" && <TournamentsPanel initialTournaments={tournaments} />}
      {tab === "jamoalar" && <TeamsPanel initialTeams={teams} tournaments={tournaments} coaches={users} />}
      {tab === "murabbiylar" && <CoachesPanel initialUsers={users} teams={teams} />}
      {tab === "yangiliklar" && <NewsPanel initialNews={news} />}
      {tab === "homiylar" && <SponsorsPanel initialSponsors={sponsors} />}
      {tab === "sozlamalar" && <SettingsPanel initialSettings={settings} />}
    </div>
  );
}
