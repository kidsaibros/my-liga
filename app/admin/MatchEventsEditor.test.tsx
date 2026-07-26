import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Match, MatchEvent, Player, Team } from "@/lib/types";

// Server action'lar mock qilinadi — bu test UI mantiqini tekshiradi, tarmoqni emas.
const listMatchEvents = vi.fn();
const createMatchEvent = vi.fn();
const deleteMatchEvent = vi.fn();

vi.mock("@/lib/actions/match-events", () => ({
  listMatchEvents: (...a: unknown[]) => listMatchEvents(...a),
  createMatchEvent: (...a: unknown[]) => createMatchEvent(...a),
  deleteMatchEvent: (...a: unknown[]) => deleteMatchEvent(...a),
}));

const { MatchEventsEditor } = await import("./MatchEventsEditor");

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

const home = makeTeam("team-h", "Qibray FC", "QF");
const away = makeTeam("team-a", "Young Tigers", "YT");

const match: Match = {
  id: "match-1",
  tournament_id: "t-1",
  group_name: "A",
  home_team_id: home.id,
  away_team_id: away.id,
  home_score: 3,
  away_score: 1,
  status: "finished",
  minute: null,
  venue: null,
  kickoff_at: "2026-05-25T18:00:00Z",
  is_featured: false,
  created_at: "2026-01-01T00:00:00Z",
  home_team: home,
  away_team: away,
};

const players: Player[] = [
  {
    id: "p-1",
    team_id: home.id,
    number: 9,
    name: "Azibek Rahimov",
    position: "FWD",
    is_starter: true,
    photo_url: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "p-2",
    team_id: away.id,
    number: 10,
    name: "Sardor Aliyev",
    position: "MID",
    is_starter: true,
    photo_url: null,
    created_at: "2026-01-01T00:00:00Z",
  },
];

const existingEvent: MatchEvent = {
  id: "ev-1",
  match_id: match.id,
  team_id: home.id,
  player_id: "p-1",
  player_name: "Azibek Rahimov",
  type: "goal",
  minute: 23,
  created_at: "2026-01-01T00:00:00Z",
};

function renderEditor(onError = vi.fn()) {
  render(<MatchEventsEditor match={match} players={players} onError={onError} />);
  return onError;
}

describe("MatchEventsEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
    listMatchEvents.mockResolvedValue({ data: [], error: null });
    deleteMatchEvent.mockResolvedValue({ data: { id: "ev-1" }, error: null });
  });

  it("mavjud hodisalarni yuklab ko'rsatadi", async () => {
    listMatchEvents.mockResolvedValue({ data: [existingEvent], error: null });
    renderEditor();

    expect(await screen.findByText("Azibek Rahimov")).toBeDefined();
    expect(screen.getByText("23'")).toBeDefined();
    // «Qibray FC» hodisa qatorida ham, jamoa tanlash ro'yxatida ham bor —
    // shuning uchun aniq qatordagi <span> ni tekshiramiz.
    expect(screen.getAllByText("Qibray FC").some((el) => el.tagName === "SPAN")).toBe(true);
  });

  it("hodisa bo'lmasa tushuntirish xabarini beradi", async () => {
    renderEditor();
    expect(await screen.findByText(/Hali hodisa yo'q/)).toBeDefined();
  });

  it("gol qo'shadi va ro'yxatga darhol qo'shib qo'yadi", async () => {
    createMatchEvent.mockResolvedValue({
      data: { ...existingEvent, id: "ev-new", player_name: "Yangi O'yinchi", minute: 55 },
      error: null,
    });
    renderEditor();
    await screen.findByText(/Hali hodisa yo'q/);

    await userEvent.type(screen.getByLabelText("O'yinchi ismi"), "Yangi O'yinchi");
    await userEvent.type(screen.getByLabelText("Daqiqa"), "55");
    await userEvent.click(screen.getByRole("button", { name: "Qo'shish" }));

    await waitFor(() => expect(createMatchEvent).toHaveBeenCalledTimes(1));
    expect(createMatchEvent.mock.calls[0][0]).toMatchObject({
      match_id: match.id,
      team_id: home.id,
      player_name: "Yangi O'yinchi",
      type: "goal",
      minute: 55,
    });
    expect(await screen.findByText("Yangi O'yinchi")).toBeDefined();
  });

  it("roster'dagi ism yozilsa player_id avtomat bog'lanadi", async () => {
    createMatchEvent.mockResolvedValue({ data: existingEvent, error: null });
    renderEditor();
    await screen.findByText(/Hali hodisa yo'q/);

    await userEvent.type(screen.getByLabelText("O'yinchi ismi"), "azibek rahimov");
    await userEvent.click(screen.getByRole("button", { name: "Qo'shish" }));

    await waitFor(() => expect(createMatchEvent).toHaveBeenCalled());
    // Katta-kichik harfdan qat'i nazar roster bilan solishtiriladi
    expect(createMatchEvent.mock.calls[0][0].player_id).toBe("p-1");
  });

  it("roster'da yo'q ism uchun player_id null qoladi", async () => {
    createMatchEvent.mockResolvedValue({ data: existingEvent, error: null });
    renderEditor();
    await screen.findByText(/Hali hodisa yo'q/);

    await userEvent.type(screen.getByLabelText("O'yinchi ismi"), "Notanish Odam");
    await userEvent.click(screen.getByRole("button", { name: "Qo'shish" }));

    await waitFor(() => expect(createMatchEvent).toHaveBeenCalled());
    expect(createMatchEvent.mock.calls[0][0].player_id).toBeNull();
  });

  it("ism bo'sh bo'lsa qo'shish tugmasi o'chirilgan", async () => {
    renderEditor();
    await screen.findByText(/Hali hodisa yo'q/);
    expect(screen.getByRole("button", { name: "Qo'shish" }).hasAttribute("disabled")).toBe(true);
  });

  it("daqiqa kiritilmasa null yuboriladi", async () => {
    createMatchEvent.mockResolvedValue({ data: existingEvent, error: null });
    renderEditor();
    await screen.findByText(/Hali hodisa yo'q/);

    await userEvent.type(screen.getByLabelText("O'yinchi ismi"), "Kimdir");
    await userEvent.click(screen.getByRole("button", { name: "Qo'shish" }));

    await waitFor(() => expect(createMatchEvent).toHaveBeenCalled());
    expect(createMatchEvent.mock.calls[0][0].minute).toBeNull();
  });

  it("hodisani o'chiradi", async () => {
    listMatchEvents.mockResolvedValue({ data: [existingEvent], error: null });
    renderEditor();
    await screen.findByText("Azibek Rahimov");

    await userEvent.click(screen.getByRole("button", { name: "Hodisani o'chirish" }));

    await waitFor(() => expect(deleteMatchEvent).toHaveBeenCalledWith("ev-1"));
    await waitFor(() => expect(screen.queryByText("Azibek Rahimov")).toBeNull());
  });

  it("server xatosini yuqoriga uzatadi va ro'yxatni o'zgartirmaydi", async () => {
    createMatchEvent.mockResolvedValue({ data: null, error: "Ruxsat yo'q" });
    const onError = renderEditor();
    await screen.findByText(/Hali hodisa yo'q/);

    await userEvent.type(screen.getByLabelText("O'yinchi ismi"), "Kimdir");
    await userEvent.click(screen.getByRole("button", { name: "Qo'shish" }));

    await waitFor(() => expect(onError).toHaveBeenCalledWith("Ruxsat yo'q"));
    expect(screen.queryByText("Kimdir")).toBeNull();
  });

  it("jamoa almashtirilganda taklif ro'yxati ham almashadi", async () => {
    renderEditor();
    await screen.findByText(/Hali hodisa yo'q/);

    // Boshida uy egalari tanlangan → faqat uning o'yinchisi taklif qilinadi
    const options = () => [...document.querySelectorAll("datalist option")].map((o) => o.getAttribute("value"));
    expect(options()).toEqual(["Azibek Rahimov"]);

    await userEvent.selectOptions(screen.getByLabelText("Jamoa"), away.id);
    expect(options()).toEqual(["Sardor Aliyev"]);
  });
});
