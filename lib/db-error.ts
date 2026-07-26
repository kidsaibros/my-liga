/** Postgres xato matnini foydalanuvchiga tushunarli o'zbekcha xabarga aylantiradi. */
export function friendlyDbError(message: string, code?: string): string {
  if (code === "23505" || message.includes("duplicate key value violates unique constraint")) {
    // Bizning trigger'larimiz (masalan turnir ichida jamoa nomi unikalligi) allaqachon
    // o'zbekcha tushunarli xabar bilan RAISE EXCEPTION qiladi — shuni o'zgarishsiz qaytaramiz.
    // Agar (kelajakda) oddiy DB unique index xato bersa, umumiy xabarga tushamiz.
    if (!message.includes("duplicate key value violates unique constraint")) return message;
    return "Bu qiymat allaqachon band — boshqasini tanlang.";
  }
  if (message.includes("violates foreign key constraint")) {
    return "Bu yozuv boshqa ma'lumotlar bilan bog'langan (masalan, o'yinlar, turnirlar yoki tarkib) — avval o'sha bog'liq ma'lumotlarni o'chiring, so'ng qayta urinib ko'ring.";
  }
  if (message.includes("permission denied")) {
    return "Ruxsat yo'q — bu amalni faqat administrator bajara oladi.";
  }
  return message;
}
