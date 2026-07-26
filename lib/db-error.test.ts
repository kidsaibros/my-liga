import { describe, expect, it } from "vitest";
import { friendlyDbError } from "./db-error";

describe("friendlyDbError", () => {
  it("unique constraint xatosini tushunarli xabarga aylantiradi", () => {
    expect(
      friendlyDbError('duplicate key value violates unique constraint "teams_slug_key"', "23505")
    ).toBe("Bu qiymat allaqachon band — boshqasini tanlang.");
  });

  it("trigger yozgan o'zbekcha xabarni o'zgarishsiz qaytaradi", () => {
    const msg = "Bu turnirda shunday nomli jamoa allaqachon bor";
    expect(friendlyDbError(msg, "23505")).toBe(msg);
  });

  it("foreign key xatosini izohlaydi", () => {
    const out = friendlyDbError('update or delete on table "teams" violates foreign key constraint');
    expect(out).toContain("boshqa ma'lumotlar bilan bog'langan");
  });

  it("ruxsat yo'q xatosini izohlaydi", () => {
    expect(friendlyDbError("permission denied for table teams")).toBe(
      "Ruxsat yo'q — bu amalni faqat administrator bajara oladi."
    );
  });

  it("noma'lum xatoni o'zgarishsiz qaytaradi", () => {
    expect(friendlyDbError("connection timeout")).toBe("connection timeout");
  });
});
