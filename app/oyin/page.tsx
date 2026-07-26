import { createClient } from "@/lib/supabase/server";
import type { ChatMessage, Match } from "@/lib/types";
import { MatchClient } from "./MatchClient";

/** Live o'yin va chat — hech qachon keshlanmaydi. */
export const dynamic = "force-dynamic";

export default async function MatchPage() {
  const supabase = await createClient();

  const { data: match } = await supabase
    .from("matches")
    .select(
      "*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*), tournament:tournaments(*)"
    )
    .eq("is_featured", true)
    .single();

  if (!match) {
    return (
      <div className="flex flex-1 items-center justify-center px-5 py-16 text-center text-sm text-[rgba(237,244,239,0.4)]">
        Hozircha faol o'yin yo'q
      </div>
    );
  }

  const { data: messages } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("match_id", match.id)
    .order("created_at", { ascending: true });

  return <MatchClient match={match as Match} initialMessages={(messages ?? []) as ChatMessage[]} />;
}
