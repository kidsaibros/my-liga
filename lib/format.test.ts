import { describe, expect, it } from "vitest";
import { formatMatchDateTime, slugify } from "./format";

describe("formatMatchDateTime", () => {
  it("ISO sanani o'zbekcha «kun oy yil · soat» formatiga aylantiradi", () => {
    expect(formatMatchDateTime("2024-05-25T18:00:00Z")).toBe("25 May 2024 · 18:00");
  });

  it("daqiqani ikki xonali qilib to'ldiradi", () => {
    expect(formatMatchDateTime("2024-01-03T09:05:00Z")).toBe("3 Yan 2024 · 09:05");
  });

  it("mahalliy vaqt zonasidan qat'i nazar UTC'ni ko'rsatadi (kickoff_at qanday saqlangan bo'lsa)", () => {
    // +05:00 → UTC 18:00, ya'ni sana ham, soat ham UTC bo'yicha o'qiladi.
    expect(formatMatchDateTime("2024-05-25T23:00:00+05:00")).toBe("25 May 2024 · 18:00");
  });
});

describe("slugify", () => {
  it("bo'shliqlarni chiziqchaga almashtiradi va kichik harfga o'tkazadi", () => {
    expect(slugify("Yoshlar Ligasi")).toBe("yoshlar-ligasi");
  });

  it("apostrof va maxsus belgilarni tashlab yuboradi", () => {
    expect(slugify("NAVRO'Z KUBOGI")).toBe("navro-z-kubogi");
  });

  it("bosh va oxirgi chiziqchalarni kesadi", () => {
    expect(slugify("  --DXX Kubogi!!  ")).toBe("dxx-kubogi");
  });

  it("ketma-ket ajratuvchilarni bitta chiziqchaga siqadi", () => {
    expect(slugify("A   ///   B")).toBe("a-b");
  });
});
