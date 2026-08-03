import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TournamentDetailClient } from "./TournamentDetailClient";
import type { Match, PlayerStat, Standing, Team, Tournament } from "@/lib/types";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));
vi.mock("@/components/BottomNav", () => ({ BottomNav: () => null }));

function makeTeam(name: string, init: string): Team {
  return {
    id: `team-${init}`,
    slug: init.toLowerCase(),
    name,
    init,
    crest_gradient: "linear-gradient(140deg,#1E7A42,#0B2E18)",
    crest_border: "rgba(47,216,113,0.45)",
    crest_color: "#7CF0AC",
    logo_url: null,
    coach_email: null,
    coach_id: null,
    status: "approved",
    created_by: null,
    created_at: "2024-01-01T00:00:00Z",
  };
}

const home = makeTeam("Qibray FC", "QF");
const away = makeTeam("Young Tigers", "YT");

function makeMatch(id: string, status: Match["status"], homeScore = 0, awayScore = 0): Match {
  return {
    id,
    tournament_id: "T1",
    group_name: "A",
    home_team_id: home.id,
    away_team_id: away.id,
    home_score: homeScore,
    away_score: awayScore,
    status,
    minute: status === "live" ? 72 : null,
    venue: "Qibray markaziy stadioni",
    kickoff_at: "2024-05-25T18:00:00Z",
    is_featured: false,
    reminder_sent: false,
    live_started_at: null,
    created_at: "2024-01-01T00:00:00Z",
    home_team: home,
    away_team: away,
  };
}

const tournament: Tournament = {
  id: "T1",
  slug: "dxx-kubogi",
  name: "DXX KUBOGI",
  dates_label: "20 May – 10 Iyun 2024",
  starts_on: "2024-05-20",
  ends_on: "2024-06-10",
  team_count: 16,
  status: "faol",
  format: "liga",
  logo_url: null,
  created_at: "2024-01-01T00:00:00Z",
  regulations: "Birinchi qoida\nIkkinchi qoida\n\n  Uchinchi qoida  ",
};

const standings: Standing[] = [
  {
    id: "s1",
    tournament_id: "T1",
    team_id: home.id,
    group_name: "A",
    pos: 1,
    played: 6,
    won: 5,
    drawn: 0,
    lost: 1,
    goals_for: 18,
    goals_against: 7,
    points: 15,
    team: home,
  },
];

const scorers: PlayerStat[] = [
  { id: "p1", player_name: "Azibek Rahimov", team_id: home.id, goals: 12, assists: 3, created_at: "2024-01-01T00:00:00Z", team: home },
  { id: "p2", player_name: "Sardor Aliyev", team_id: away.id, goals: 9, assists: 8, created_at: "2024-01-01T00:00:00Z", team: away },
  // Golsiz o'yinchi «To'purarlar» ro'yxatiga tushmasligi kerak.
  { id: "p3", player_name: "Golsiz O'yinchi", team_id: away.id, goals: 0, assists: 4, created_at: "2024-01-01T00:00:00Z", team: away },
];

function renderPage(overrides: Partial<Parameters<typeof TournamentDetailClient>[0]> = {}) {
  return render(
    <TournamentDetailClient
      tournament={tournament}
      standings={standings}
      upcoming={[makeMatch("m1", "scheduled"), makeMatch("m2", "live", 2, 1)]}
      results={[makeMatch("m3", "finished", 3, 1)]}
      scorers={scorers}
      {...overrides}
    />
  );
}

describe("TournamentDetailClient", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("beshta tabni ko'rsatadi", () => {
    renderPage();
    for (const label of ["Jadval", "O'yinlar", "Natijalar", "To'purarlar", "Reglament"]) {
      expect(screen.getByRole("button", { name: label })).toBeDefined();
    }
  });

  it("boshlang'ich holatda «Jadval» ochiq bo'ladi", () => {
    renderPage();
    expect(screen.getByText("Pley-off bosqichiga chiqish zonasi")).toBeDefined();
    expect(screen.getByText("15")).toBeDefined(); // ochkolar
  });

  it("«O'yinlar» tabi jonli o'yinni alohida bo'limga ajratadi", async () => {
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "O'yinlar" }));

    expect(screen.getByText("Hozir o'ynalmoqda")).toBeDefined();
    expect(screen.getByText(/JONLI 72'/)).toBeDefined();

    // Jonli o'yin «kelgusi» hisoblanmaydi — sanoqda faqat 1 ta scheduled qoladi.
    expect(screen.getByText("Kelgusi o'yinlar")).toBeDefined();
    expect(screen.getByText("1 ta")).toBeDefined();
    expect(screen.getAllByText("Qibray markaziy stadioni")).toHaveLength(2);
  });

  it("jonli o'yin bo'lmasa «Hozir o'ynalmoqda» bo'limi ko'rsatilmaydi", async () => {
    renderPage({ upcoming: [makeMatch("m1", "scheduled")] });
    await userEvent.click(screen.getByRole("button", { name: "O'yinlar" }));

    expect(screen.queryByText("Hozir o'ynalmoqda")).toBeNull();
    expect(screen.getByText("1 ta")).toBeDefined();
  });

  it("«Natijalar» tabi hisobni ko'rsatadi", async () => {
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Natijalar" }));

    expect(screen.getByText("Yakunlangan o'yinlar")).toBeDefined();
    expect(screen.getByText("3")).toBeDefined();
    expect(screen.getByText("1")).toBeDefined();
  });

  it("«To'purarlar» tabi golsiz o'yinchini chiqarib tashlaydi va gol bo'yicha saralaydi", async () => {
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "To'purarlar" }));

    expect(screen.getByText("Azibek Rahimov")).toBeDefined();
    expect(screen.getByText("Sardor Aliyev")).toBeDefined();
    expect(screen.queryByText("Golsiz O'yinchi")).toBeNull();

    const names = screen.getAllByText(/Rahimov|Aliyev/).map((el) => el.textContent);
    expect(names).toEqual(["Azibek Rahimov", "Sardor Aliyev"]);
  });

  it("«Reglament» tabi har bir qatorni alohida band qiladi va bo'sh qatorlarni tashlaydi", async () => {
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Reglament" }));

    expect(screen.getByText("Birinchi qoida")).toBeDefined();
    expect(screen.getByText("Ikkinchi qoida")).toBeDefined();
    expect(screen.getByText("Uchinchi qoida")).toBeDefined();
    expect(document.querySelectorAll("ol > li")).toHaveLength(3);
  });

  it("ma'lumot yo'q bo'lganda har bir tab bo'sh holat xabarini ko'rsatadi", async () => {
    renderPage({
      tournament: { ...tournament, regulations: null },
      standings: [],
      upcoming: [],
      results: [],
      scorers: [],
    });

    expect(screen.getByText("Jadval ma'lumotlari hali yo'q")).toBeDefined();

    await userEvent.click(screen.getByRole("button", { name: "O'yinlar" }));
    expect(screen.getByText("Rejalashtirilgan o'yinlar yo'q")).toBeDefined();

    await userEvent.click(screen.getByRole("button", { name: "Natijalar" }));
    expect(screen.getByText("Hali birorta o'yin yakunlanmagan")).toBeDefined();

    await userEvent.click(screen.getByRole("button", { name: "To'purarlar" }));
    expect(screen.getByText("Gol statistikasi hali kiritilmagan")).toBeDefined();

    await userEvent.click(screen.getByRole("button", { name: "Reglament" }));
    expect(screen.getByText("Reglament hali kiritilmagan")).toBeDefined();
  });
});
