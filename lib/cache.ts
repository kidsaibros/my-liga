import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { Match, News, PlayerStat, Sponsor, Standing, Tournament } from "@/lib/types";

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

export type HomeData = {
  matches: Match[];
  activeTournaments: number;
  sponsors: Sponsor[];
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

  const [{ data: matches }, { count }, { data: sponsors }] = await Promise.all([
    supabase
      .from("matches")
      .select("*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)")
      .eq("status", "scheduled")
      .order("kickoff_at", { ascending: true })
      .limit(3),
    supabase.from("tournaments").select("*", { count: "exact", head: true }).eq("status", "faol"),
    supabase.from("sponsors").select("*").order("sort_order", { ascending: true }),
  ]);

  return {
    matches: (matches ?? []) as unknown as Match[],
    activeTournaments: count ?? 0,
    sponsors: (sponsors ?? []) as Sponsor[],
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

/** Umumiy gol/pas statistikasi (/statistika). */
export async function getPlayerStats(): Promise<PlayerStat[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.playerStats);

  const supabase = createPublicClient();
  const { data } = await supabase
    .from("player_stats")
    .select("*, team:teams(*)")
    .order("goals", { ascending: false });
  return (data ?? []) as unknown as PlayerStat[];
}

export type TournamentDetail = {
  tournament: Tournament;
  standings: Standing[];
  upcoming: Match[];
  results: Match[];
  scorers: PlayerStat[];
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

  // «To'purarlar» tabi — player_stats turnirga emas, jamoaga bog'langan, shuning
  // uchun turnir tarkibidagi jamoalar bo'yicha filtrlaymiz (standings = turnir-jamoa
  // bog'lanishi). Jamoalar hali kiritilmagan bo'lsa, so'rovni umuman yubormaymiz.
  const teamIds = (standings ?? []).map((s) => s.team_id);
  const { data: scorers } = teamIds.length
    ? await supabase
        .from("player_stats")
        .select("*, team:teams(*)")
        .in("team_id", teamIds)
        .order("goals", { ascending: false })
    : { data: [] };

  return {
    tournament: tournament as Tournament,
    standings: (standings ?? []) as unknown as Standing[],
    upcoming: (upcoming ?? []) as unknown as Match[],
    results: (results ?? []) as unknown as Match[],
    scorers: (scorers ?? []) as unknown as PlayerStat[],
  };
}
