import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StatistikaClient } from "./StatistikaClient";
import type { Scorer, Team } from "@/lib/types";

vi.mock("@/components/Screen", () => ({
  Screen: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

function makeTeam(id: string, name: string, init: string): Team {
  return {
    id,
    slug: init.toLowerCase(),
    name,
    init,
    crest_gradient: "x",
    crest_border: "x",
    crest_color: "#fff",
    logo_url: null,
    coach_email: null,
    coach_id: null,
    status: "approved",
    created_by: null,
    created_at: "2026-01-01T00:00:00Z",
  };
}

const teamA = makeTeam("t-a", "Qibray FC", "QF");
const teamB = makeTeam("t-b", "Young Tigers", "YT");

const scorer = (name: string, team: Team, goals: number, assists: number): Scorer => ({
  player_name: name,
  team_id: team.id,
  goals,
  assists,
  team,
});

const players: Scorer[] = [
  scorer("Golchi", teamA, 10, 1),
  scorer("Uzatuvchi", teamB, 0, 7),
  scorer("Ikkalasi", teamA, 4, 4),
];

describe("StatistikaClient", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("«To'purarlar» tabida golsizlarni ko'rsatmaydi", () => {
    render(<StatistikaClient players={players} />);

    expect(screen.getByText("Golchi")).toBeDefined();
    expect(screen.getByText("Ikkalasi")).toBeDefined();
    // 0 golli o'yinchi to'purarlar ro'yxatida turmasligi kerak
    expect(screen.queryByText("Uzatuvchi")).toBeNull();
  });

  it("«Assistentlar» tabida uzatmasizlarni ko'rsatmaydi va uzatma bo'yicha saralaydi", async () => {
    render(<StatistikaClient players={players} />);
    await userEvent.click(screen.getByRole("button", { name: "Assistentlar" }));

    const names = screen.getAllByText(/Golchi|Uzatuvchi|Ikkalasi/).map((el) => el.textContent);
    expect(names).toEqual(["Uzatuvchi", "Ikkalasi", "Golchi"]);
  });

  it("«Gol + Pas» tabi yig'indi bo'yicha saralaydi", async () => {
    render(<StatistikaClient players={players} />);
    await userEvent.click(screen.getByRole("button", { name: "Gol + Pas" }));

    // Golchi 11, Ikkalasi 8, Uzatuvchi 7
    const names = screen.getAllByText(/Golchi|Uzatuvchi|Ikkalasi/).map((el) => el.textContent);
    expect(names).toEqual(["Golchi", "Ikkalasi", "Uzatuvchi"]);
  });

  it("ma'lumot bo'lmasa tushuntirish xabarini beradi", () => {
    render(<StatistikaClient players={[]} />);
    expect(screen.getByText(/Hozircha ma'lumot yo'q/)).toBeDefined();
  });

  it("tanlangan tabda hamma ko'rsatkich 0 bo'lsa ham bo'sh holat chiqadi", async () => {
    render(<StatistikaClient players={[scorer("Faqat gol", teamA, 3, 0)]} />);
    await userEvent.click(screen.getByRole("button", { name: "Assistentlar" }));

    expect(screen.getByText(/Hozircha ma'lumot yo'q/)).toBeDefined();
    expect(screen.queryByText("Faqat gol")).toBeNull();
  });

  it("eng ko'pi bilan 5 ta o'yinchi ko'rsatiladi", () => {
    const many = Array.from({ length: 9 }, (_, i) => scorer(`O'yinchi ${i}`, teamA, 9 - i, 0));
    render(<StatistikaClient players={many} />);

    expect(screen.getAllByText(/^O'yinchi \d$/)).toHaveLength(5);
  });
});
