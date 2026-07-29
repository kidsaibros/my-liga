import { createClient } from "@/lib/supabase/server";
import type { ChatMessage, Lineup, Match, Player, Standing } from "@/lib/types";
import { MatchClient } from "./MatchClient";

/** Live o'yin va chat — hech qachon keshlanmaydi. */
export const dynamic = "force-dynamic";

export default async function MatchPage() {
  const supabase = await createClient();

  // `maybeSingle()` — asosiy uchrashuv belgilanmagan bo'lsa xato emas, bo'sh holat.
  const { data: match } = await supabase
    .from("matches")
    .select(
      "*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*), tournament:tournaments(*)"
    )
    .eq("is_featured", true)
    .maybeSingle();

  if (!match) {
    return (
      <div className="flex flex-1 items-center justify-center px-5 py-16 text-center text-sm text-[var(--fg-muted)]">
        Hozircha faol o&apos;yin yo&apos;q
      </div>
    );
  }

  const teamIds = [match.home_team_id, match.away_team_id];

  const [{ data: messages }, { data: players }, { data: lineups }, { data: standings }] = await Promise.all([
    supabase.from("chat_messages").select("*").eq("match_id", match.id).order("created_at", { ascending: true }),
    // «Tarkib» tabi uchun
    supabase.from("players").select("*").in("team_id", teamIds).order("number", { ascending: true }),
    supabase.from("lineups").select("*").in("team_id", teamIds),
    // «O'yin haqida» tabidagi turnir jadvalidagi o'rin
    supabase.from("standings").select("*, team:teams(*)").eq("tournament_id", match.tournament_id),
  ]);

  return (
    <MatchClient
      match={match as unknown as Match}
      initialMessages={(messages ?? []) as ChatMessage[]}
      players={(players ?? []) as Player[]}
      lineups={(lineups ?? []) as Lineup[]}
      standings={(standings ?? []) as unknown as Standing[]}
    />
  );
}
