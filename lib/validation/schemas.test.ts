import { describe, expect, it } from "vitest";
import {
  appSettingsSchema,
  coachInviteSchema,
  idSchema,
  playerSchema,
  sponsorSchema,
  teamSchema,
  tournamentSchema,
} from "./schemas";

/** gen_random_uuid() chiqaradigan haqiqiy v4 UUID namunasi. */
const TEST_UUID = "3f1a5c9e-7b2d-4e8a-9c31-6d0f4b8e2a71";

const validTournament = {
  slug: "dxx-kubogi",
  name: "DXX KUBOGI",
  dates_label: "20 May – 10 Iyun 2024",
  starts_on: "2024-05-20",
  ends_on: "2024-06-10",
  team_count: 16,
  status: "faol",
};

describe("tournamentSchema", () => {
  it("to'g'ri turnirni qabul qiladi", () => {
    expect(tournamentSchema.safeParse(validTournament).success).toBe(true);
  });

  it("tugash sanasi boshlanishdan oldin bo'lsa rad etadi", () => {
    const r = tournamentSchema.safeParse({ ...validTournament, ends_on: "2024-05-01" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].path).toEqual(["ends_on"]);
  });

  it("noto'g'ri slug'ni rad etadi (bosh harf/bo'shliq)", () => {
    expect(tournamentSchema.safeParse({ ...validTournament, slug: "DXX Kubogi" }).success).toBe(false);
  });

  it("noma'lum statusni rad etadi", () => {
    expect(tournamentSchema.safeParse({ ...validTournament, status: "tugagan" }).success).toBe(false);
  });

  it("reglamentni ixtiyoriy deb biladi va bo'sh satrni undefined qiladi", () => {
    const r = tournamentSchema.safeParse({ ...validTournament, regulations: "" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.regulations).toBeUndefined();
  });

  it("reglament matnini saqlaydi", () => {
    const text = "Birinchi qoida\nIkkinchi qoida";
    const r = tournamentSchema.safeParse({ ...validTournament, regulations: text });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.regulations).toBe(text);
  });

  it("10000 belgidan uzun reglamentni rad etadi", () => {
    const r = tournamentSchema.safeParse({ ...validTournament, regulations: "a".repeat(10001) });
    expect(r.success).toBe(false);
  });

  it("team_count'ni satrdan songa keltiradi", () => {
    const r = tournamentSchema.safeParse({ ...validTournament, team_count: "24" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.team_count).toBe(24);
  });
});

describe("teamSchema", () => {
  const validTeam = {
    slug: "qibray-fc",
    name: "Qibray FC",
    init: "qf",
    crest_gradient: "linear-gradient(140deg,#1E7A42,#0B2E18)",
    crest_border: "rgba(47,216,113,0.45)",
    crest_color: "#7CF0AC",
  };

  it("qisqartmani bosh harfga o'tkazadi", () => {
    const r = teamSchema.safeParse(validTeam);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.init).toBe("QF");
  });

  it("3 belgidan uzun qisqartmani rad etadi", () => {
    expect(teamSchema.safeParse({ ...validTeam, init: "QIBR" }).success).toBe(false);
  });

  it("noto'g'ri murabbiy emailini rad etadi", () => {
    expect(teamSchema.safeParse({ ...validTeam, coach_email: "not-an-email" }).success).toBe(false);
  });

  it("bo'sh coach_email'ni undefined qiladi", () => {
    const r = teamSchema.safeParse({ ...validTeam, coach_email: "" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.coach_email).toBeUndefined();
  });
});

describe("sponsorSchema", () => {
  it("standart qiymatlarni qo'llaydi", () => {
    const r = sponsorSchema.safeParse({ name: "Homiy" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.is_featured).toBe(false);
      expect(r.data.sort_order).toBe(0);
    }
  });

  it("javascript: sxemali havolani rad etadi (XSS himoyasi)", () => {
    expect(sponsorSchema.safeParse({ name: "Homiy", link_url: "javascript:alert(1)" }).success).toBe(false);
  });

  it("data: sxemali havolani rad etadi", () => {
    expect(sponsorSchema.safeParse({ name: "Homiy", logo_url: "data:text/html;base64,PHN2Zz4=" }).success).toBe(false);
  });

  it("https havolani qabul qiladi", () => {
    expect(sponsorSchema.safeParse({ name: "Homiy", link_url: "https://example.uz" }).success).toBe(true);
  });
});

describe("playerSchema", () => {
  const teamId = TEST_UUID;

  it("0–99 oralig'idagi raqamni qabul qiladi", () => {
    expect(playerSchema.safeParse({ team_id: teamId, number: 10, name: "Azibek", position: "FWD" }).success).toBe(true);
  });

  it("99 dan katta raqamni rad etadi", () => {
    expect(playerSchema.safeParse({ team_id: teamId, number: 100, name: "Azibek", position: "FWD" }).success).toBe(false);
  });

  it("noma'lum pozitsiyani rad etadi", () => {
    expect(playerSchema.safeParse({ team_id: teamId, number: 10, name: "Azibek", position: "STRIKER" }).success).toBe(false);
  });

  it("noto'g'ri team_id (UUID emas) ni rad etadi", () => {
    expect(playerSchema.safeParse({ team_id: "abc", number: 10, name: "Azibek", position: "FWD" }).success).toBe(false);
  });
});

describe("coachInviteSchema", () => {
  it("emailni kichik harfga keltiradi", () => {
    const r = coachInviteSchema.safeParse({ email: "  Coach@Example.COM " });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("coach@example.com");
  });
});

describe("appSettingsSchema", () => {
  it("barcha maydonlar ixtiyoriy", () => {
    expect(appSettingsSchema.safeParse({}).success).toBe(true);
  });

  it("noto'g'ri telegram havolasini rad etadi", () => {
    expect(appSettingsSchema.safeParse({ telegram_support_url: "t.me/support" }).success).toBe(false);
  });
});

describe("idSchema", () => {
  it("UUID'ni qabul qiladi", () => {
    expect(idSchema.safeParse(TEST_UUID).success).toBe(true);
  });

  it("UUID bo'lmagan qiymatni rad etadi", () => {
    expect(idSchema.safeParse("123").success).toBe(false);
  });
});
