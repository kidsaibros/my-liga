const MONTHS = [
  "Yan", "Fev", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];

/** "2024-05-25T18:00:00Z" → "25 May 2024 · 18:00" (UTC, kickoff_at qanday saqlangan bo'lsa shunday ko'rsatiladi). */
export function formatMatchDateTime(iso: string): string {
  const d = new Date(iso);
  const day = d.getUTCDate();
  const month = MONTHS[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${day} ${month} ${year} · ${hh}:${mm}`;
}

/** "Yoshlar Ligasi" → "yoshlar-ligasi" — turnir slug maydonini avtomatik to'ldirish uchun. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
