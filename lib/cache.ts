import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { Match, News, Scorer, ScorerRow, Sponsor, Standing, Team, Tournament } from "@/lib/types";

/**
 * NEGA `export const revalidate` EMAS:
 * `app/layout.tsx` har bir so'rovda `getSessionProfile()` ni chaqiradi, u esa
 * `cookies()` ga tayanadi — bu butun daraxtni majburan dinamik render qiladi,
 * ya'ni sahifa darajasidagi ISR kuchga kirmaydi (`next build` chiqishida barcha
 * yo'nalishlar `ƒ Dynamic` bo'lib ko'rinadi).
 *
 * Shuning uchun SAHIFA emas, MA'LUMOT keshlanadi. Sahifa dinamik bo'lib
 * qolaveradi (foydalanuvchiga xos header to'g'ri ishlaydi), lekin DB'ga har
 * so'rovda emas, kesh muddati tugaganda yoki admin o'zgartirish kiritganda
 * boriladi.
 *
 * NEGA `unstable_cache` EMAS:
 * Next 16'da u amalda keshlamaydi — o'lchovda `unstable_cache` bilan o'ralgan
 * chaqiruv ham, xom so'rov ham bir xil ~440ms olardi. `"use cache"` direktivasi
 * uning o'rnini bosadi (`next.config.ts` da `experimental.useCache: true`).
 *
 * Keshni bekor qilish: Server Action ichida `revalidateTag(CACHE_TAGS.xxx, "max")`.
 */
export const CACHE_TAGS = {
  tournaments: "tournaments",
  standings: "standings",
  matches: "matches",
  playerStats: "player-stats",
  news: "news",
  sponsors: "sponsors",
} as const;

export type LeagueChip = { id: string; name: string; slug: string };

export type HomeData = {
  matches: Match[];
  activeTournaments: number;
  sponsors: Sponsor[];
  leagues: LeagueChip[];
};

/**
 * Bosh sahifaning ochiq ma'lumoti (yaqin o'yinlar + faol turnirlar soni + homiylar).
 * Foydalanuvchiga xos qism (`getSessionProfile()`) bu yerga kirmaydi — u
 * `app/page.tsx` da alohida, keshlanmasdan o'qiladi.
 */
export async function getHomeData(): Promise<HomeData> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.matches, CACHE_TAGS.tournaments, CACHE_TAGS.sponsors);

  const supabase = createPublicClient();

  const [{ data: matches }, { count }, { data: sponsors }, { data: leagues }] = await Promise.all([
    supabase
      .from("matches")
      .select("*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)")
      .eq("status", "scheduled")
      .order("kickoff_at", { ascending: true })
      .limit(3),
    supabase.from("tournaments").select("*", { count: "exact", head: true }).eq("status", "faol"),
    supabase.from("sponsors").select("*").order("sort_order", { ascending: true }),
    supabase
      .from("tournaments")
      .select("id, name, slug")
      .eq("format", "liga")
      .eq("status", "faol")
      .order("name", { ascending: true }),
  ]);

  return {
    matches: (matches ?? []) as unknown as Match[],
    activeTournaments: count ?? 0,
    sponsors: (sponsors ?? []) as Sponsor[],
    leagues: (leagues ?? []) as LeagueChip[],
  };
}

/** Turnirlar ro'yxati (/turnirlar). */
export async function getTournaments(): Promise<Tournament[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.tournaments);

  const supabase = createPublicClient();
  const { data } = await supabase.from("tournaments").select("*").order("starts_on", { ascending: false });
  return (data ?? []) as Tournament[];
}

/** Yangiliklar ro'yxati (/yangiliklar). */
export async function getNews(): Promise<News[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.news);

  const supabase = createPublicClient();
  const { data } = await supabase.from("news").select("*").order("published_at", { ascending: false });
  return (data ?? []) as News[];
}

/**
 * RPC faqat (ism, team_id, gol, uzatma) qaytaradi — jamoa ma'lumotini alohida
 * so'rab, xotirada bog'laymiz (RPC natijasiga PostgREST join qila olmaydi).
 * Jamoasi topilmagan qatorlar tashlab yuboriladi — ular UI'da baribir
 * ko'rsatib bo'lmaydi.
 */
async function attachTeams(rows: ScorerRow[]): Promise<Scorer[]> {
  if (rows.length === 0) return [];

  const supabase = createPublicClient();
  const teamIds = [...new Set(rows.map((r) => r.team_id))];
  const { data: teams } = await supabase.from("teams").select("*").in("id", teamIds);

  const byId = new Map((teams ?? []).map((t) => [t.id, t as Team]));
  return rows
    .map((r) => {
      const team = byId.get(r.team_id);
      return team ? { ...r, team } : null;
    })
    .filter((r): r is Scorer => r !== null);
}

/** Umumiy gol/uzatma statistikasi (/statistika) — barcha turnirlar bo'yicha. */
export async function getOverallScorers(): Promise<Scorer[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.playerStats);

  const supabase = createPublicClient();
  const { data } = await supabase.rpc("overall_scorers");
  return attachTeams((data ?? []) as ScorerRow[]);
}

export type TournamentDetail = {
  tournament: Tournament;
  standings: Standing[];
  upcoming: Match[];
  results: Match[];
  scorers: Scorer[];
} | null;

/** Turnir tafsilotlari sahifasining barcha 5 ta tabi uchun ma'lumot (/turnirlar/[slug]). */
export async function getTournamentDetail(slug: string): Promise<TournamentDetail> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.tournaments, CACHE_TAGS.standings, CACHE_TAGS.matches, CACHE_TAGS.playerStats);

  const supabase = createPublicClient();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!tournament) return null;

  const teamSelect =
    "*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)";

  const [{ data: standings }, { data: upcoming }, { data: results }] = await Promise.all([
    // «Jadval» tabi
    supabase
      .from("standings")
      .select("*, team:teams(*)")
      .eq("tournament_id", tournament.id)
      .order("pos", { ascending: true }),

    // «O'yinlar» tabi — bo'lib o'tmagan uchrashuvlar, eng yaqini birinchi
    supabase
      .from("matches")
      .select(teamSelect)
      .eq("tournament_id", tournament.id)
      .in("status", ["scheduled", "live"])
      .order("kickoff_at", { ascending: true }),

    // «Natijalar» tabi — yakunlangan uchrashuvlar, eng so'nggisi birinchi
    supabase
      .from("matches")
      .select(teamSelect)
      .eq("tournament_id", tournament.id)
      .eq("status", "finished")
      .order("kickoff_at", { ascending: false }),
  ]);

  // «To'purarlar» tabi — SHU TURNIRDAGI o'yin hodisalaridan hisoblanadi (0021).
  // Ilgari `player_stats` ishlatilardi, u esa turnirga bog'lanmagan edi: bir
  // jamoa ikki turnirda qatnashsa, gollari qo'shilib ketardi.
  const { data: scorerRows } = await supabase.rpc("tournament_scorers", {
    p_tournament_id: tournament.id,
  });

  return {
    tournament: tournament as Tournament,
    standings: (standings ?? []) as unknown as Standing[],
    upcoming: (upcoming ?? []) as unknown as Match[],
    results: (results ?? []) as unknown as Match[],
    scorers: await attachTeams((scorerRows ?? []) as ScorerRow[]),
  };
}
